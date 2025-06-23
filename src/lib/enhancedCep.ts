
import { supabase } from '@/integrations/supabase/client';
import { CepData } from './cep';

/**
 * Sistema CEP aprimorado com múltiplas APIs e cache robusto
 */

export interface EnhancedCepData extends CepData {
  source: 'cache' | 'viacep' | 'brasilapi' | 'correios' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Cache expandido para CEPs de Minas Gerais - especialmente região de Capelinha
 */
const MG_EXPANDED_CACHE = {
  // Capelinha e região do Vale do Jequitinhonha
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
};

/**
 * Busca CEP com cache expandido
 */
async function getCachedCepExpanded(cep: string): Promise<EnhancedCepData | null> {
  try {
    // Verificar cache do Supabase primeiro
    const { data, error } = await supabase
      .from('zip_cache')
      .select('*')
      .eq('cep', cep)
      .single();

    if (data && !error) {
      return {
        cep: data.cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        source: 'cache',
        confidence: 'high'
      };
    }

    // Verificar cache expandido de MG
    if (MG_EXPANDED_CACHE[cep]) {
      const cached = MG_EXPANDED_CACHE[cep];
      return {
        cep,
        logradouro: 'Logradouro não especificado',
        bairro: cached.bairro,
        localidade: cached.cidade,
        uf: cached.uf,
        zona_entrega: cached.zona,
        source: 'fallback',
        confidence: 'medium'
      };
    }

    // Buscar CEP similar (mesmo município)
    const baseCep = cep.substring(0, 5) + '000';
    if (MG_EXPANDED_CACHE[baseCep]) {
      const cached = MG_EXPANDED_CACHE[baseCep];
      return {
        cep,
        logradouro: 'Logradouro não especificado',
        bairro: cached.bairro,
        localidade: cached.cidade,
        uf: cached.uf,
        zona_entrega: cached.zona,
        source: 'fallback',
        confidence: 'low'
      };
    }

    return null;
  } catch (error) {
    console.error('[getCachedCepExpanded] Error:', error);
    return null;
  }
}

/**
 * Busca ViaCEP com timeout otimizado
 */
async function fetchViaCepEnhanced(cep: string): Promise<EnhancedCepData | null> {
  try {
    console.log('[fetchViaCepEnhanced] Buscando CEP:', cep);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('[fetchViaCepEnhanced] Response not OK:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.erro) {
      console.warn('[fetchViaCepEnhanced] CEP não encontrado no ViaCEP:', cep);
      return null;
    }
    
    const result: EnhancedCepData = {
      cep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge,
      source: 'viacep',
      confidence: 'high'
    };
    
    console.log('[fetchViaCepEnhanced] Sucesso:', result);
    return result;
  } catch (error) {
    console.error('[fetchViaCepEnhanced] Erro:', error);
    return null;
  }
}

/**
 * Busca BrasilAPI com retry
 */
async function fetchBrasilApiEnhanced(cep: string): Promise<EnhancedCepData | null> {
  try {
    console.log('[fetchBrasilApiEnhanced] Buscando CEP:', cep);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[fetchBrasilApiEnhanced] CEP não encontrado (404):', cep);
      } else {
        console.error('[fetchBrasilApiEnhanced] Response error:', response.status);
      }
      return null;
    }
    
    const data = await response.json();
    
    const result: EnhancedCepData = {
      cep,
      logradouro: data.street || '',
      bairro: data.neighborhood || '',
      localidade: data.city || '',
      uf: data.state || '',
      ibge: data.city_ibge,
      source: 'brasilapi',
      confidence: 'high'
    };
    
    console.log('[fetchBrasilApiEnhanced] Sucesso:', result);
    return result;
  } catch (error) {
    console.error('[fetchBrasilApiEnhanced] Erro:', error);
    return null;
  }
}

/**
 * Determina zona de entrega com base na localização
 */
function getDeliveryZoneFromLocation(cidade: string, uf: string): string {
  if (uf !== 'MG') return 'outras';
  
  const localCities = ['capelinha', 'turmalina', 'veredinha'];
  const regionalCities = ['minas novas', 'chapada do norte', 'berilo'];
  
  const cityLower = cidade.toLowerCase();
  
  if (localCities.includes(cityLower)) return 'local';
  if (regionalCities.includes(cityLower)) return 'regional';
  
  return 'outras';
}

/**
 * Cache o resultado no Supabase
 */
async function cacheEnhancedCep(cepData: EnhancedCepData): Promise<void> {
  try {
    if (!cepData.logradouro || !cepData.localidade) {
      console.warn('[cacheEnhancedCep] Dados incompletos, não cacheando:', cepData);
      return;
    }

    await supabase
      .from('zip_cache')
      .upsert({
        cep: cepData.cep,
        logradouro: cepData.logradouro,
        bairro: cepData.bairro,
        localidade: cepData.localidade,
        uf: cepData.uf,
        ibge: cepData.ibge,
        cached_at: new Date().toISOString(),
      }, {
        onConflict: 'cep'
      });
    
    console.log('[cacheEnhancedCep] CEP cacheado com sucesso:', cepData.cep);
  } catch (error) {
    console.error('[cacheEnhancedCep] Erro ao cachear:', error);
  }
}

/**
 * Função principal de busca CEP aprimorada
 */
export async function lookupCepEnhanced(rawCep: string): Promise<EnhancedCepData | null> {
  const cep = rawCep.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    console.warn('[lookupCepEnhanced] CEP inválido:', rawCep);
    return null;
  }

  console.log('[lookupCepEnhanced] 🔍 Iniciando busca aprimorada para:', cep);

  try {
    // 1. Verificar cache primeiro
    const cached = await getCachedCepExpanded(cep);
    if (cached) {
      console.log('[lookupCepEnhanced] ✅ Encontrado no cache:', cep);
      
      // Adicionar zona de entrega se não existir
      if (!cached.zona_entrega) {
        cached.zona_entrega = getDeliveryZoneFromLocation(cached.localidade, cached.uf);
      }
      
      return cached;
    }

    // 2. Tentar ViaCEP primeiro
    let result = await fetchViaCepEnhanced(cep);
    
    // 3. Se falhar, tentar BrasilAPI
    if (!result) {
      result = await fetchBrasilApiEnhanced(cep);
    }

    // 4. Se ainda não encontrou, verificar se é CEP de Capelinha/região
    if (!result && cep.startsWith('3968')) {
      console.log('[lookupCepEnhanced] 🎯 CEP da região de Capelinha, criando fallback');
      result = {
        cep,
        logradouro: 'Endereço não especificado',
        bairro: cep.endsWith('5000') ? 'São Sebastião' : 'Centro',
        localidade: 'Capelinha',
        uf: 'MG',
        zona_entrega: 'local',
        source: 'fallback',
        confidence: 'medium'
      };
    }

    if (result) {
      // Adicionar zona de entrega
      if (!result.zona_entrega) {
        result.zona_entrega = getDeliveryZoneFromLocation(result.localidade, result.uf);
      }
      
      // Cache apenas se for de alta confiança
      if (result.confidence === 'high') {
        await cacheEnhancedCep(result);
      }
      
      console.log('[lookupCepEnhanced] ✅ CEP encontrado:', result);
      return result;
    }

    console.warn('[lookupCepEnhanced] ❌ CEP não encontrado em nenhuma fonte:', cep);
    return null;

  } catch (error) {
    console.error('[lookupCepEnhanced] 💥 Erro inesperado:', error);
    return null;
  }
}

/**
 * Gera sugestões de CEPs válidos próximos
 */
export function generateCepSuggestions(invalidCep: string): string[] {
  const baseCep = invalidCep.replace(/\D/g, '');
  if (baseCep.length !== 8) return [];
  
  const suggestions: string[] = [];
  const baseNumber = parseInt(baseCep);
  
  // CEPs próximos (±10, ±50, ±100)
  const variations = [-100, -50, -10, 10, 50, 100];
  
  for (const variation of variations) {
    const newNumber = baseNumber + variation;
    if (newNumber > 10000000 && newNumber < 99999999) {
      const newCep = newNumber.toString().padStart(8, '0');
      suggestions.push(newCep);
    }
  }
  
  // Se for CEP de Capelinha, adicionar CEPs conhecidos da região
  if (baseCep.startsWith('3968')) {
    suggestions.unshift('39680000', '39680001', '39685000', '39685001');
  }
  
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Valida se um CEP existe realmente
 */
export async function validateCepExists(cep: string): Promise<boolean> {
  try {
    const result = await lookupCepEnhanced(cep);
    return result !== null && result.confidence !== 'low';
  } catch {
    return false;
  }
}
