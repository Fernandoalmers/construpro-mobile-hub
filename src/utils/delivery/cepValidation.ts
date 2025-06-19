
import { supabase } from '@/integrations/supabase/client';
import { logWithTimestamp, withTimeout, withRetry } from './logger';

/**
 * Verifica se um CEP está dentro de uma zona configurada com melhor robustez
 */
export async function checkCepInZone(customerCep: string, zoneType: string, zoneValue: string): Promise<boolean> {
  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  logWithTimestamp(`[checkCepInZone] Checking if CEP ${cleanCustomerCep} is in zone type ${zoneType} with value ${zoneValue}`);
  
  try {
    switch (zoneType) {
      case 'cep_specific':
        const cleanZoneValue = zoneValue.replace(/\D/g, '');
        const result = cleanCustomerCep === cleanZoneValue;
        logWithTimestamp('[checkCepInZone] CEP specific check:', { customerCep: cleanCustomerCep, zoneValue: cleanZoneValue, result });
        return result;
      
      case 'cep_range':
        return await withTimeout(
          checkCepRange(cleanCustomerCep, zoneValue),
          5000,
          'CEP range check'
        );
      
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
        logWithTimestamp('[checkCepInZone] Unknown zone type:', zoneType);
        return false;
    }
  } catch (error) {
    logWithTimestamp('[checkCepInZone] Error in zone check:', { zoneType, error });
    return false;
  }
}

async function checkCepRange(customerCep: string, rangeValue: string): Promise<boolean> {
  try {
    logWithTimestamp('[checkCepRange] 🔍 Starting CEP range validation:', {
      customerCep,
      rangeValue,
      customerCepLength: customerCep.length
    });

    // Split the range and clean both values
    const rangeParts = rangeValue.split('-');
    if (rangeParts.length !== 2) {
      logWithTimestamp('[checkCepRange] ❌ Invalid range format - should contain exactly one dash:', {
        rangeValue,
        parts: rangeParts
      });
      return false;
    }

    const startCep = rangeParts[0].replace(/\D/g, '').trim();
    const endCep = rangeParts[1].replace(/\D/g, '').trim();
    
    logWithTimestamp('[checkCepRange] 🧹 Cleaned range parts:', {
      originalRange: rangeValue,
      startCep,
      endCep,
      startCepLength: startCep.length,
      endCepLength: endCep.length
    });

    // Validate that both CEPs are 8 digits
    if (startCep.length !== 8 || endCep.length !== 8) {
      logWithTimestamp('[checkCepRange] ❌ Invalid CEP length in range:', {
        startCep,
        endCep,
        startCepLength: startCep.length,
        endCepLength: endCep.length
      });
      return false;
    }

    // Validate customer CEP length
    if (customerCep.length !== 8) {
      logWithTimestamp('[checkCepRange] ❌ Invalid customer CEP length:', {
        customerCep,
        length: customerCep.length
      });
      return false;
    }
    
    // Convert to numbers for comparison
    const customerCepNum = parseInt(customerCep, 10);
    const startCepNum = parseInt(startCep, 10);
    const endCepNum = parseInt(endCep, 10);
    
    logWithTimestamp('[checkCepRange] 🔢 Numeric conversion:', {
      customerCepNum,
      startCepNum,
      endCepNum,
      customerCepValid: !isNaN(customerCepNum),
      startCepValid: !isNaN(startCepNum),
      endCepValid: !isNaN(endCepNum)
    });
    
    if (isNaN(customerCepNum) || isNaN(startCepNum) || isNaN(endCepNum)) {
      logWithTimestamp('[checkCepRange] ❌ Failed to convert CEPs to numbers:', {
        customerCep,
        startCep,
        endCep,
        customerCepNum,
        startCepNum,
        endCepNum
      });
      return false;
    }

    // Validate range logic
    if (startCepNum > endCepNum) {
      logWithTimestamp('[checkCepRange] ❌ Invalid range - start CEP is greater than end CEP:', {
        startCepNum,
        endCepNum
      });
      return false;
    }
    
    // Perform the range check
    const isInRange = customerCepNum >= startCepNum && customerCepNum <= endCepNum;
    
    logWithTimestamp('[checkCepRange] 🎯 Final range validation:', {
      customerCepNum,
      startCepNum,
      endCepNum,
      isGreaterOrEqualToStart: customerCepNum >= startCepNum,
      isLessOrEqualToEnd: customerCepNum <= endCepNum,
      isInRange,
      calculation: `${customerCepNum} >= ${startCepNum} && ${customerCepNum} <= ${endCepNum} = ${isInRange}`
    });
    
    return isInRange;
  } catch (error) {
    logWithTimestamp('[checkCepRange] ❌ Exception during CEP range check:', {
      error: error.message || error,
      customerCep,
      rangeValue
    });
    return false;
  }
}

async function checkCepByIbge(customerCep: string, ibgeValue: string): Promise<boolean> {
  try {
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
