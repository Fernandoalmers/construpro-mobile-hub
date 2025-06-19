
import { supabase } from '@/integrations/supabase/client';
import { logWithTimestamp } from './logger';

/**
 * Verifica se um CEP está dentro de uma zona configurada
 */
export async function checkCepInZone(customerCep: string, zoneType: string, zoneValue: string): Promise<boolean> {
  logWithTimestamp(`[checkCepInZone] Checking if CEP ${customerCep} is in zone type ${zoneType} with value ${zoneValue}`);
  
  switch (zoneType) {
    case 'cep_specific':
      const result = customerCep === zoneValue.replace(/\D/g, '');
      logWithTimestamp('[checkCepInZone] CEP specific check:', result);
      return result;
    
    case 'cep_range':
      const [startCep, endCep] = zoneValue.split('-').map(cep => cep.replace(/\D/g, ''));
      const customerCepNum = parseInt(customerCep);
      const startCepNum = parseInt(startCep);
      const endCepNum = parseInt(endCep);
      const rangeResult = customerCepNum >= startCepNum && customerCepNum <= endCepNum;
      logWithTimestamp('[checkCepInZone] CEP range check:', {
        customerCepNum,
        startCepNum,
        endCepNum,
        result: rangeResult
      });
      return rangeResult;
    
    case 'ibge':
      try {
        logWithTimestamp('[checkCepInZone] Checking IBGE for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('ibge')
          .eq('cep', customerCep)
          .single();
        
        logWithTimestamp('[checkCepInZone] IBGE check result:', { cepData, error });
        return cepData?.ibge === zoneValue;
      } catch (error) {
        logWithTimestamp('[checkCepInZone] Error checking IBGE:', error);
        return false;
      }
    
    case 'cidade':
      try {
        logWithTimestamp('[checkCepInZone] Checking city for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('localidade')
          .eq('cep', customerCep)
          .single();
        
        logWithTimestamp('[checkCepInZone] City check result:', { cepData, error });
        return cepData?.localidade?.toLowerCase() === zoneValue.toLowerCase();
      } catch (error) {
        logWithTimestamp('[checkCepInZone] Error checking city:', error);
        return false;
      }
    
    default:
      logWithTimestamp('[checkCepInZone] Unknown zone type:', zoneType);
      return false;
  }
}
