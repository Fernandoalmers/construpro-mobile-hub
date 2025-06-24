
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

    // Detectar discrepâncias e decidir cidade correta
    if (result.viacepData && result.brasilApiData) {
      const viacepCity = result.viacepData.localidade?.toLowerCase();
      const brasilApiCity = result.brasilApiData.city?.toLowerCase();
      
      if (viacepCity !== brasilApiCity) {
        result.discrepancy = true;
        result.needsCorrection = true;
        
        // Para CEP 39688-000, usar Angelândia se uma das APIs retornar
        if (cleanCep === '39688000') {
          const angelandia = 'angelândia';
          if (viacepCity?.includes(angelandia) || brasilApiCity?.includes(angelandia)) {
            result.correctCity = 'Angelândia';
            console.log('[cepVerification] 🎯 CEP 39688-000: Confirmando Angelândia como cidade correta');
          } else {
            // Forçar Angelândia como correção conhecida
            result.correctCity = 'Angelândia';
            console.log('[cepVerification] 🎯 CEP 39688-000: Forçando correção para Angelândia (correção conhecida)');
          }
        } else {
          // Para outros CEPs, priorizar ViaCEP por ser mais oficial
          result.correctCity = result.viacepData.localidade;
        }
        
        console.warn('[cepVerification] ⚠️ DISCREPÂNCIA DETECTADA:', {
          cep: cleanCep,
          viacep: result.viacepData.localidade,
          brasilapi: result.brasilApiData.city,
          corrected_to: result.correctCity
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
    
    // Para CEP 39688-000, usar dados específicos conhecidos
    if (cep === '39688000') {
      const { error } = await supabase
        .from('zip_cache')
        .upsert({
          cep: cep,
          logradouro: 'Endereço não especificado',
          bairro: 'Centro',
          localidade: 'Angelândia',
          uf: 'MG',
          ibge: '3102803',
          cached_at: new Date().toISOString(),
        }, {
          onConflict: 'cep'
        });
      
      if (error) {
        console.error('[cepVerification] ❌ Erro ao corrigir CEP 39688-000:', error);
        return false;
      }
      
      console.log('[cepVerification] ✅ CEP 39688-000 corrigido para Angelândia-MG');
      return true;
    }
    
    // Para outros CEPs, usar dados fornecidos
    const { error } = await supabase
      .from('zip_cache')
      .upsert({
        cep: cep,
        logradouro: correctData.logradouro || correctData.street || '',
        bairro: correctData.bairro || correctData.neighborhood || '',
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
  
  // Log especial para CEP 39688-000
  if (cep === '39688000') {
    console.log('[cepVerification] 🎯 CEP 39688-000 reportado como incorreto. Cidade encontrada:', foundCity, 'vs esperada: Angelândia');
  }
}

/**
 * Verifica e corrige CEP 39688-000 especificamente
 */
export async function investigateCep39688(): Promise<void> {
  console.log('[cepVerification] 🎯 Investigando CEP 39688-000 especificamente...');
  
  const verification = await verifyCepExternally('39688000');
  
  console.log('[cepVerification] 📋 Resultado da investigação 39688-000:', {
    viacep_city: verification.viacepData?.localidade,
    brasilapi_city: verification.brasilApiData?.city,
    discrepancy: verification.discrepancy,
    correction_needed: verification.needsCorrection,
    correct_city: verification.correctCity
  });
  
  // Sempre forçar correção para Angelândia para CEP 39688-000
  console.log('[cepVerification] 🔧 Forçando correção para CEP 39688-000 -> Angelândia-MG');
  
  const corrected = await correctCepInCache('39688000', {
    logradouro: 'Endereço não especificado',
    bairro: 'Centro',
    localidade: 'Angelândia',
    uf: 'MG',
    ibge: '3102803'
  });
  
  if (corrected) {
    console.log('[cepVerification] ✅ CEP 39688-000 corrigido com sucesso para Angelândia-MG');
  } else {
    console.error('[cepVerification] ❌ Falha na correção do CEP 39688-000');
  }
}

// Executar investigação automaticamente para CEP problemático
if (typeof window !== 'undefined') {
  // Aguardar um pouco e então investigar
  setTimeout(() => {
    investigateCep39688().catch(console.error);
  }, 2000);
}
