
import { supabase } from '@/integrations/supabase/client';

export interface CepVerificationResult {
  cep: string;
  viacepData?: any;
  brasilApiData?: any;
  discrepancy: boolean;
  correctCity?: string;
  needsCorrection: boolean;
}

/**
 * Verifica um CEP específico em APIs externas e detecta discrepâncias
 */
export async function verifyCepExternally(cep: string): Promise<CepVerificationResult> {
  const cleanCep = cep.replace(/\D/g, '');
  
  console.log('[cepVerification] 🔍 Verificando CEP externamente:', cleanCep);
  
  const result: CepVerificationResult = {
    cep: cleanCep,
    discrepancy: false,
    needsCorrection: false
  };

  try {
    // Verificar ViaCEP
    try {
      const viacepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viacepResponse.ok) {
        const viacepData = await viacepResponse.json();
        if (!viacepData.erro) {
          result.viacepData = viacepData;
          console.log('[cepVerification] ✅ ViaCEP:', viacepData.localidade, '-', viacepData.uf);
        }
      }
    } catch (error) {
      console.error('[cepVerification] Erro ViaCEP:', error);
    }

    // Verificar BrasilAPI
    try {
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      if (brasilApiResponse.ok) {
        const brasilApiData = await brasilApiResponse.json();
        result.brasilApiData = brasilApiData;
        console.log('[cepVerification] ✅ BrasilAPI:', brasilApiData.city, '-', brasilApiData.state);
      }
    } catch (error) {
      console.error('[cepVerification] Erro BrasilAPI:', error);
    }

    // Detectar discrepâncias
    if (result.viacepData && result.brasilApiData) {
      const viacepCity = result.viacepData.localidade?.toLowerCase();
      const brasilApiCity = result.brasilApiData.city?.toLowerCase();
      
      if (viacepCity !== brasilApiCity) {
        result.discrepancy = true;
        result.needsCorrection = true;
        
        // Decidir qual cidade usar (priorizar ViaCEP por ser mais oficial)
        result.correctCity = result.viacepData.localidade;
        
        console.warn('[cepVerification] ⚠️ DISCREPÂNCIA DETECTADA:', {
          cep: cleanCep,
          viacep: result.viacepData.localidade,
          brasilapi: result.brasilApiData.city
        });
      }
    }

    return result;
  } catch (error) {
    console.error('[cepVerification] 💥 Erro na verificação:', error);
    return result;
  }
}

/**
 * Corrige CEP específico no cache se houver discrepância
 */
export async function correctCepInCache(cep: string, correctData: any): Promise<boolean> {
  try {
    console.log('[cepVerification] 🔧 Corrigindo CEP no cache:', cep);
    
    const { error } = await supabase
      .from('zip_cache')
      .upsert({
        cep: cep,
        logradouro: correctData.logradouro || '',
        bairro: correctData.bairro || '',
        localidade: correctData.localidade || correctData.city,
        uf: correctData.uf || correctData.state,
        ibge: correctData.ibge || correctData.city_ibge,
        cached_at: new Date().toISOString(),
      }, {
        onConflict: 'cep'
      });
    
    if (error) {
      console.error('[cepVerification] ❌ Erro ao corrigir cache:', error);
      return false;
    }
    
    console.log('[cepVerification] ✅ CEP corrigido no cache');
    return true;
  } catch (error) {
    console.error('[cepVerification] 💥 Erro ao corrigir cache:', error);
    return false;
  }
}

/**
 * Reporta CEP incorreto para log
 */
export async function reportIncorrectCep(cep: string, reportedCity: string, foundCity: string): Promise<void> {
  console.log('[cepVerification] 📝 Reportando CEP incorreto:', {
    cep,
    reported: reportedCity,
    found: foundCity,
    timestamp: new Date().toISOString()
  });
  
  // Em uma implementação real, isso poderia ir para um sistema de logs ou notificações
  // Por enquanto, apenas logamos para o console
}

/**
 * Verifica e corrige CEP 39688-000 especificamente
 */
export async function investigateCep39688(): Promise<void> {
  console.log('[cepVerification] 🎯 Investigando CEP 39688-000 especificamente...');
  
  const verification = await verifyCepExternally('39688000');
  
  if (verification.discrepancy || verification.needsCorrection) {
    console.log('[cepVerification] 🔧 Correção necessária para 39688-000');
    
    if (verification.viacepData) {
      await correctCepInCache('39688000', verification.viacepData);
    } else if (verification.brasilApiData) {
      await correctCepInCache('39688000', {
        logradouro: verification.brasilApiData.street || '',
        bairro: verification.brasilApiData.neighborhood || '',
        localidade: verification.brasilApiData.city,
        uf: verification.brasilApiData.state,
        ibge: verification.brasilApiData.city_ibge
      });
    }
  }
  
  // Log dos resultados
  console.log('[cepVerification] 📋 Resultado da investigação 39688-000:', {
    viacep_city: verification.viacepData?.localidade,
    brasilapi_city: verification.brasilApiData?.city,
    discrepancy: verification.discrepancy,
    correction_needed: verification.needsCorrection
  });
}
