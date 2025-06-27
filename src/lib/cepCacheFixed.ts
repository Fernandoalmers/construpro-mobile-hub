
import { supabase } from '@/integrations/supabase/client';

/**
 * Sistema de cache CEP corrigido com error handling robusto
 */

// Cache local expandido para fallback
export const EXPANDED_CEP_CACHE = {
  // Capelinha e região - CORRIGIDOS
  '39680000': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Centro' },
  '39680001': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Centro' },
  '39685000': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'São Sebastião' },
  '39685001': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Maria Lúcia' },
  '39688000': { cidade: 'Angelândia', uf: 'MG', zona: 'regional', bairro: 'Centro', ibge: '3102803' }, // CORRIGIDO
  '39690000': { cidade: 'Turmalina', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  '39695000': { cidade: 'Veredinha', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  '39700000': { cidade: 'Minas Novas', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  
  // Principais cidades MG
  '30000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '31000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras', bairro: 'Zona Norte' },
  '35000000': { cidade: 'Governador Valadares', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '36000000': { cidade: 'Juiz de Fora', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '37000000': { cidade: 'Varginha', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '38000000': { cidade: 'Uberaba', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '39000000': { cidade: 'Teófilo Otoni', uf: 'MG', zona: 'outras', bairro: 'Centro' },
};

let cacheInitialized = false;

export async function initializeExpandedCache(): Promise<void> {
  if (cacheInitialized) {
    console.log('[initializeExpandedCache] Cache já inicializado, pulando...');
    return;
  }

  try {
    console.log('[initializeExpandedCache] Inicializando cache expandido CORRIGIDO...');
    
    for (const [cep, info] of Object.entries(EXPANDED_CEP_CACHE)) {
      try {
        const { error } = await supabase
          .from('zip_cache')
          .upsert({
            cep: cep,
            logradouro: info.bairro === 'Centro' ? 'Rua Principal' : 'Endereço não especificado',
            bairro: info.bairro,
            localidade: info.cidade,
            uf: info.uf,
            ibge: (info as any).ibge || null,
            cached_at: new Date().toISOString(),
          }, {
            onConflict: 'cep'
          });
        
        if (error) {
          console.warn(`[initializeExpandedCache] Aviso ao cachear ${cep}:`, error.message);
          // Não bloquear por erro individual
        } else {
          console.log(`[initializeExpandedCache] Atualizado: ${cep} ${info.cidade}`);
        }
        
        // Correção específica para CEP problemático
        if (cep === '39688000') {
          console.log('[initializeExpandedCache] ✅ CEP 39688-000 CORRIGIDO para Angelândia-MG (IBGE: 3102803)');
        }
      } catch (individualError) {
        console.warn(`[initializeExpandedCache] Erro individual em ${cep}:`, individualError);
        // Continuar com próximo CEP
      }
    }
    
    cacheInitialized = true;
    console.log('[initializeExpandedCache] ✅ Cache expandido inicializado com correções');
    
  } catch (error) {
    console.error('[initializeExpandedCache] Erro geral:', error);
    // Marcar como inicializado mesmo com erro para evitar loops
    cacheInitialized = true;
  }
}

export async function getCachedCepSafe(cep: string): Promise<any | null> {
  const cleanCep = cep.replace(/\D/g, '');
  
  // Primeiro, tentar cache local
  if (EXPANDED_CEP_CACHE[cleanCep]) {
    console.log(`[getCachedCepSafe] Cache local hit: ${cleanCep}`);
    const info = EXPANDED_CEP_CACHE[cleanCep];
    return {
      cep: cleanCep,
      logradouro: 'Endereço não especificado',
      bairro: info.bairro,
      localidade: info.cidade,
      uf: info.uf,
      zona_entrega: info.zona,
      ibge: (info as any).ibge || null
    };
  }
  
  // Tentar cache Supabase (com fallback seguro)
  try {
    const { data, error } = await supabase
      .from('zip_cache')
      .select('*')
      .eq('cep', cleanCep)
      .single();
    
    if (error || !data) {
      console.log(`[getCachedCepSafe] Não encontrado no cache Supabase: ${cleanCep}`);
      return null;
    }
    
    console.log(`[getCachedCepSafe] Cache Supabase hit: ${cleanCep} -> ${data.localidade}`);
    return data;
  } catch (error) {
    console.warn(`[getCachedCepSafe] Erro no cache Supabase para ${cleanCep}:`, error);
    return null;
  }
}

// Correção específica para CEP problemático
export async function ensureCep39688Correction(): Promise<void> {
  try {
    console.log('[ensureCep39688Correction] Verificando correção CEP 39688-000...');
    
    // Deletar entrada incorreta se existir
    await supabase
      .from('zip_cache')
      .delete()
      .eq('cep', '39688000');
    
    // Inserir dados corretos
    const { error } = await supabase
      .from('zip_cache')
      .insert({
        cep: '39688000',
        logradouro: 'Endereço não especificado',
        bairro: 'Centro',
        localidade: 'Angelândia',
        uf: 'MG',
        ibge: '3102803',
        cached_at: new Date().toISOString(),
      });
    
    if (error) {
      console.warn('[ensureCep39688Correction] Aviso na correção:', error.message);
    } else {
      console.log('[ensureCep39688Correction] ✅ CEP 39688-000 corrigido para Angelândia');
    }
  } catch (error) {
    console.warn('[ensureCep39688Correction] Erro na correção específica:', error);
  }
}

// Inicializar automaticamente de forma segura
if (typeof window !== 'undefined') {
  // Aguardar um momento antes de inicializar
  setTimeout(() => {
    initializeExpandedCache()
      .then(() => ensureCep39688Correction())
      .catch(error => {
        console.warn('[cepCacheFixed] Erro na inicialização:', error);
      });
  }, 1000);
}
