
import { supabase } from '@/integrations/supabase/client';

// Cache expandido de CEPs principais de Minas Gerais para fallback offline
export const MG_CEPS_CACHE = {
  // Capelinha e região do Vale do Jequitinhonha - EXPANDIDO
  '39680000': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Centro' },
  '39680001': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Centro' },
  '39685000': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'São Sebastião' },
  '39685001': { cidade: 'Capelinha', uf: 'MG', zona: 'local', bairro: 'Maria Lúcia' },
  '39690000': { cidade: 'Turmalina', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  '39695000': { cidade: 'Veredinha', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  '39700000': { cidade: 'Minas Novas', uf: 'MG', zona: 'regional', bairro: 'Centro' },
  
  // Principais cidades de MG
  '30000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '31000000': { cidade: 'Belo Horizonte', uf: 'MG', zona: 'outras', bairro: 'Zona Norte' },
  '35000000': { cidade: 'Governador Valadares', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '36000000': { cidade: 'Juiz de Fora', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '37000000': { cidade: 'Varginha', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '38000000': { cidade: 'Uberaba', uf: 'MG', zona: 'outras', bairro: 'Centro' },
  '39000000': { cidade: 'Teófilo Otoni', uf: 'MG', zona: 'outras', bairro: 'Centro' },
};

export async function initializeCepCache(): Promise<void> {
  try {
    console.log('[initializeCepCache] Inicializando cache expandido de CEPs...');
    
    for (const [cep, info] of Object.entries(MG_CEPS_CACHE)) {
      const { error } = await supabase
        .from('zip_cache')
        .upsert({
          cep: cep,
          logradouro: info.bairro === 'Centro' ? 'Rua Principal' : 'Endereço não especificado',
          bairro: info.bairro,
          localidade: info.cidade,
          uf: info.uf,
          cached_at: new Date().toISOString(),
        }, {
          onConflict: 'cep'
        });
      
      if (error) {
        console.error(`[initializeCepCache] Erro ao cachear ${cep}:`, error);
      }
    }
    
    console.log('[initializeCepCache] Cache expandido inicializado com', Object.keys(MG_CEPS_CACHE).length, 'CEPs');
  } catch (error) {
    console.error('[initializeCepCache] Erro geral:', error);
  }
}

export async function getCachedCepFallback(cep: string): Promise<any | null> {
  // Verificar cache direto primeiro
  if (MG_CEPS_CACHE[cep]) {
    console.log('[getCachedCepFallback] Cache direto encontrado para:', cep);
    return {
      cep: cep,
      logradouro: 'Endereço não especificado',
      bairro: MG_CEPS_CACHE[cep].bairro,
      localidade: MG_CEPS_CACHE[cep].cidade,
      uf: MG_CEPS_CACHE[cep].uf,
      zona_entrega: MG_CEPS_CACHE[cep].zona,
    };
  }

  // Verificar por região (CEP base)
  const cepBase = cep.substring(0, 5) + '000';
  if (MG_CEPS_CACHE[cepBase]) {
    console.log('[getCachedCepFallback] Usando fallback regional para:', cep, '->', cepBase);
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
    
    // Lista expandida de CEPs importantes para pré-carregar
    const importantCeps = [
      // Capelinha e região
      '39680000', '39680001', '39685000', '39685001',
      '39690000', '39695000', '39700000',
      // Principais cidades MG
      '30112000', '31000000', '35000000', '36000000',
      '37000000', '38000000', '39000000'
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

// Inicializar cache automaticamente
if (typeof window !== 'undefined') {
  initializeCepCache().catch(console.error);
}
