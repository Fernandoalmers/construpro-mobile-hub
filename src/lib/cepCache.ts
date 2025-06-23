
import { supabase } from '@/integrations/supabase/client';

// Cache de CEPs principais de Minas Gerais para fallback offline
export const MG_CEPS_CACHE = {
  // Belo Horizonte
  '30000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras' },
  '31000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras' },
  
  // Capelinha e região
  '39680000': { cidade: 'Capelinha', uf: 'MG', zona: 'local' },
  '39685000': { cidade: 'Capelinha', uf: 'MG', zona: 'local' },
  '39690000': { cidade: 'Turmalina', uf: 'MG', zona: 'regional' },
  '39695000': { cidade: 'Veredinha', uf: 'MG', zona: 'regional' },
  
  // Outras cidades importantes de MG
  '35000000': { cidade: 'Governador Valadares', uf: 'MG', zona: 'outras' },
  '36000000': { cidade: 'Juiz de Fora', uf: 'MG', zona: 'outras' },
  '37000000': { cidade: 'Varginha', uf: 'MG', zona: 'outras' },
  '38000000': { cidade: 'Uberaba', uf: 'MG', zona: 'outras' },
  '39000000': { cidade: 'Teófilo Otoni', uf: 'MG', zona: 'outras' },
};

export async function initializeCepCache(): Promise<void> {
  try {
    console.log('[initializeCepCache] Inicializando cache de CEPs...');
    
    for (const [cep, info] of Object.entries(MG_CEPS_CACHE)) {
      const { error } = await supabase
        .from('zip_cache')
        .upsert({
          cep: cep,
          logradouro: 'Centro',
          bairro: 'Centro',
          localidade: info.cidade,
          uf: info.uf,
          zona_entrega: info.zona,
          cached_at: new Date().toISOString(),
        }, {
          onConflict: 'cep'
        });
      
      if (error) {
        console.error(`[initializeCepCache] Erro ao cachear ${cep}:`, error);
      }
    }
    
    console.log('[initializeCepCache] Cache inicializado com', Object.keys(MG_CEPS_CACHE).length, 'CEPs');
  } catch (error) {
    console.error('[initializeCepCache] Erro geral:', error);
  }
}

export async function getCachedCepFallback(cep: string): Promise<any | null> {
  const cepBase = cep.substring(0, 5) + '000'; // CEP base da região
  
  if (MG_CEPS_CACHE[cepBase]) {
    console.log('[getCachedCepFallback] Usando fallback para:', cep, '->', cepBase);
    return {
      cep: cep,
      logradouro: 'Endereço não especificado',
      bairro: 'Centro',
      localidade: MG_CEPS_CACHE[cepBase].cidade,
      uf: MG_CEPS_CACHE[cepBase].uf,
      zona_entrega: MG_CEPS_CACHE[cepBase].zona,
    };
  }
  
  return null;
}

export async function expandCepCache(): Promise<void> {
  try {
    console.log('[expandCepCache] Expandindo cache com APIs externas...');
    
    // Lista de CEPs importantes para pré-carregar
    const importantCeps = [
      '30112000', // BH Centro
      '31000000', // BH
      '35000000', // Gov Valadares
      '36000000', // Juiz de Fora
      '39685000', // Capelinha
    ];
    
    for (const cep of importantCeps) {
      try {
        // Verificar se já está no cache
        const { data: existing } = await supabase
          .from('zip_cache')
          .select('cep')
          .eq('cep', cep)
          .single();
        
        if (existing) continue;
        
        // Buscar nas APIs
        const viacepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (viacepResponse.ok) {
          const data = await viacepResponse.json();
          if (!data.erro) {
            await supabase
              .from('zip_cache')
              .insert({
                cep: cep,
                logradouro: data.logradouro || '',
                bairro: data.bairro || '',
                localidade: data.localidade || '',
                uf: data.uf || '',
                cached_at: new Date().toISOString(),
              });
            
            console.log('[expandCepCache] CEP cacheado:', cep);
          }
        }
        
        // Delay para não sobrecarregar APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[expandCepCache] Erro ao cachear ${cep}:`, error);
      }
    }
  } catch (error) {
    console.error('[expandCepCache] Erro geral:', error);
  }
}
