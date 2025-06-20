
import { supabase } from '@/integrations/supabase/client';
import { logWithTimestamp, withTimeout, withRetry } from './logger';

/**
 * Verifica se um CEP está dentro de uma zona configurada com melhor robustez
 */
export async function checkCepInZone(customerCep: string, zoneType: string, zoneValue: string): Promise<boolean> {
  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  logWithTimestamp(`[checkCepInZone] 🚀 STARTING CEP ZONE CHECK:`, {
    customerCep: cleanCustomerCep,
    zoneType,
    zoneValue,
    originalCustomerCep: customerCep
  });
  
  try {
    switch (zoneType) {
      case 'cep_specific':
        const cleanZoneValue = zoneValue.replace(/\D/g, '');
        const result = cleanCustomerCep === cleanZoneValue;
        logWithTimestamp('[checkCepInZone] ✅ CEP SPECIFIC RESULT:', { 
          customerCep: cleanCustomerCep, 
          zoneValue: cleanZoneValue, 
          result,
          comparison: `${cleanCustomerCep} === ${cleanZoneValue}`
        });
        return result;
      
      case 'cep_range':
        logWithTimestamp('[checkCepInZone] 🔍 CALLING CEP RANGE CHECK:', {
          customerCep: cleanCustomerCep,
          rangeValue: zoneValue
        });
        const rangeResult = await withTimeout(
          checkCepRange(cleanCustomerCep, zoneValue),
          5000,
          'CEP range check'
        );
        logWithTimestamp('[checkCepInZone] ✅ CEP RANGE FINAL RESULT:', {
          customerCep: cleanCustomerCep,
          rangeValue: zoneValue,
          result: rangeResult
        });
        return rangeResult;
      
      case 'ibge':
        return await withTimeout(
          checkCepByIbge(cleanCustomerCep, zoneValue),
          6000,
          'IBGE check'
        );
      
      case 'cidade':
        return await withTimeout(
          checkCepByCity(cleanCustomerCep, zoneValue),
          6000,
          'City check'
        );
      
      default:
        logWithTimestamp('[checkCepInZone] ❌ UNKNOWN ZONE TYPE:', zoneType);
        return false;
    }
  } catch (error) {
    logWithTimestamp('[checkCepInZone] 💥 CRITICAL ERROR in zone check:', { 
      zoneType, 
      customerCep: cleanCustomerCep,
      zoneValue,
      error: error?.message || error 
    });
    return false;
  }
}

async function checkCepRange(customerCep: string, rangeValue: string): Promise<boolean> {
  try {
    logWithTimestamp('[checkCepRange] 🚀 STARTING CEP RANGE VALIDATION:', {
      customerCep,
      rangeValue,
      customerCepLength: customerCep.length,
      customerCepType: typeof customerCep,
      rangeValueType: typeof rangeValue
    });

    // Validate input parameters
    if (!customerCep || !rangeValue) {
      logWithTimestamp('[checkCepRange] ❌ INVALID INPUT - Missing parameters:', {
        customerCep: !!customerCep,
        rangeValue: !!rangeValue
      });
      return false;
    }

    // Split the range and clean both values
    const rangeParts = rangeValue.split('-');
    if (rangeParts.length !== 2) {
      logWithTimestamp('[checkCepRange] ❌ INVALID RANGE FORMAT - should contain exactly one dash:', {
        rangeValue,
        parts: rangeParts,
        partsCount: rangeParts.length
      });
      return false;
    }

    const startCep = rangeParts[0].replace(/\D/g, '').trim();
    const endCep = rangeParts[1].replace(/\D/g, '').trim();
    
    logWithTimestamp('[checkCepRange] 🧹 CLEANED RANGE PARTS:', {
      originalRange: rangeValue,
      startCep,
      endCep,
      startCepLength: startCep.length,
      endCepLength: endCep.length,
      rangeParts
    });

    // Validate that both CEPs are 8 digits
    if (startCep.length !== 8 || endCep.length !== 8) {
      logWithTimestamp('[checkCepRange] ❌ INVALID CEP LENGTH in range:', {
        startCep,
        endCep,
        startCepLength: startCep.length,
        endCepLength: endCep.length,
        expected: 8
      });
      return false;
    }

    // Validate customer CEP length
    if (customerCep.length !== 8) {
      logWithTimestamp('[checkCepRange] ❌ INVALID CUSTOMER CEP LENGTH:', {
        customerCep,
        length: customerCep.length,
        expected: 8
      });
      return false;
    }
    
    // Convert to numbers for comparison
    const customerCepNum = parseInt(customerCep, 10);
    const startCepNum = parseInt(startCep, 10);
    const endCepNum = parseInt(endCep, 10);
    
    logWithTimestamp('[checkCepRange] 🔢 NUMERIC CONVERSION RESULTS:', {
      customerCep,
      customerCepNum,
      startCep,
      startCepNum,
      endCep,
      endCepNum,
      customerCepValid: !isNaN(customerCepNum),
      startCepValid: !isNaN(startCepNum),
      endCepValid: !isNaN(endCepNum)
    });
    
    if (isNaN(customerCepNum) || isNaN(startCepNum) || isNaN(endCepNum)) {
      logWithTimestamp('[checkCepRange] ❌ FAILED NUMERIC CONVERSION:', {
        customerCep,
        startCep,
        endCep,
        customerCepNum,
        startCepNum,
        endCepNum,
        customerCepIsNaN: isNaN(customerCepNum),
        startCepIsNaN: isNaN(startCepNum),
        endCepIsNaN: isNaN(endCepNum)
      });
      return false;
    }

    // Validate range logic
    if (startCepNum > endCepNum) {
      logWithTimestamp('[checkCepRange] ❌ INVALID RANGE LOGIC - start CEP is greater than end CEP:', {
        startCepNum,
        endCepNum,
        difference: startCepNum - endCepNum
      });
      return false;
    }
    
    // Perform the range check
    const isGreaterOrEqual = customerCepNum >= startCepNum;
    const isLessOrEqual = customerCepNum <= endCepNum;
    const isInRange = isGreaterOrEqual && isLessOrEqual;
    
    logWithTimestamp('[checkCepRange] 🎯 FINAL RANGE VALIDATION RESULT:', {
      customerCepNum,
      startCepNum,
      endCepNum,
      isGreaterOrEqual,
      isLessOrEqual,
      isInRange,
      calculation: `${customerCepNum} >= ${startCepNum} && ${customerCepNum} <= ${endCepNum} = ${isInRange}`,
      detailedCheck: {
        step1: `${customerCepNum} >= ${startCepNum} = ${isGreaterOrEqual}`,
        step2: `${customerCepNum} <= ${endCepNum} = ${isLessOrEqual}`,
        final: `${isGreaterOrEqual} && ${isLessOrEqual} = ${isInRange}`
      }
    });
    
    return isInRange;
  } catch (error) {
    logWithTimestamp('[checkCepRange] 💥 EXCEPTION during CEP range check:', {
      error: error?.message || error,
      stack: error?.stack,
      customerCep,
      rangeValue
    });
    return false;
  }
}

async function checkCepByIbge(customerCep: string, ibgeValue: string): Promise<boolean> {
  try {
    logWithTimestamp('[checkCepByIbge] Starting IBGE check:', { customerCep, ibgeValue });
    
    const { data: cepData, error } = await supabase
      .from('zip_cache')
      .select('ibge')
      .eq('cep', customerCep)
      .single();
    
    if (error) {
      logWithTimestamp('[checkCepByIbge] Database error:', error);
      return false;
    }
    
    const result = cepData?.ibge === ibgeValue;
    logWithTimestamp('[checkCepByIbge] IBGE check result:', { cepData, ibgeValue, result });
    return result;
  } catch (error) {
    logWithTimestamp('[checkCepByIbge] Error checking IBGE:', error);
    return false;
  }
}

async function checkCepByCity(customerCep: string, cityValue: string): Promise<boolean> {
  try {
    logWithTimestamp('[checkCepByCity] Starting city check:', { customerCep, cityValue });
    
    const { data: cepData, error } = await supabase
      .from('zip_cache')
      .select('localidade')
      .eq('cep', customerCep)
      .single();
    
    if (error) {
      logWithTimestamp('[checkCepByCity] Database error:', error);
      return false;
    }
    
    const result = cepData?.localidade?.toLowerCase() === cityValue.toLowerCase();
    logWithTimestamp('[checkCepByCity] City check result:', { cepData, cityValue, result });
    return result;
  } catch (error) {
    logWithTimestamp('[checkCepByCity] Error checking city:', error);
    return false;
  }
}
