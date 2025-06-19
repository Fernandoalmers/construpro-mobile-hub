
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
    const [startCep, endCep] = rangeValue.split('-').map(cep => cep.replace(/\D/g, ''));
    if (!startCep || !endCep) {
      logWithTimestamp('[checkCepRange] Invalid range format:', rangeValue);
      return false;
    }
    
    const customerCepNum = parseInt(customerCep);
    const startCepNum = parseInt(startCep);
    const endCepNum = parseInt(endCep);
    
    if (isNaN(customerCepNum) || isNaN(startCepNum) || isNaN(endCepNum)) {
      logWithTimestamp('[checkCepRange] Invalid CEP numbers:', { customerCep, startCep, endCep });
      return false;
    }
    
    const rangeResult = customerCepNum >= startCepNum && customerCepNum <= endCepNum;
    logWithTimestamp('[checkCepRange] CEP range check:', {
      customerCepNum,
      startCepNum,
      endCepNum,
      result: rangeResult
    });
    
    return rangeResult;
  } catch (error) {
    logWithTimestamp('[checkCepRange] Error:', error);
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
