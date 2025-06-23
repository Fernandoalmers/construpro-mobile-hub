import { supabase } from '@/integrations/supabase/client';

export type CepData = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  latitude?: number;
  longitude?: number;
  zona_entrega?: string;
  prazo_entrega?: string;
  source?: 'cache' | 'viacep' | 'brasilapi' | 'correios' | 'fallback';
};

export type DeliveryZone = {
  zone_type: string;
  zone_name: string;
  ibge_code: string | null;
  delivery_time: string;
};

/**
 * LEGACY SYSTEM - Use enhancedCep.ts for new implementations
 * This file is kept for backward compatibility
 */

/**
 * Sanitiza o CEP removendo caracteres não numéricos
 */
export function sanitizeCep(rawCep: string): string {
  return rawCep.replace(/\D/g, '');
}

/**
 * Valida se o CEP tem 8 dígitos
 */
export function isValidCep(cep: string): boolean {
  const sanitized = sanitizeCep(cep);
  return sanitized.length === 8;
}

/**
 * VALIDAÇÃO FLEXÍVEL - Aceita dados parciais válidos (compatibilidade)
 */
function isValidCepData(data: any): boolean {
  if (!data) return false;
  
  // Verificar se campos essenciais básicos existem (flexível)
  const hasBasics = data.localidade && data.uf;
  
  if (!hasBasics) {
    console.warn('[isValidCepData] Faltam campos básicos (cidade/UF):', data);
    return false;
  }
  
  console.log('[isValidCepData] ✅ Dados considerados válidos (validação flexível):', data);
  return true;
}

/**
 * Busca CEP no cache do Supabase
 */
async function getCachedCep(cep: string): Promise<CepData | null> {
  try {
    const { data, error } = await supabase
      .from('zip_cache')
      .select('*')
      .eq('cep', cep)
      .single();

    if (error || !data) return null;

    const cepData: CepData = {
      cep: data.cep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      source: 'cache' as const,
    };

    // Validar se os dados em cache são válidos
    if (!isValidCepData(cepData)) {
      console.warn('[getCachedCep] Dados em cache inválidos, removendo do cache:', cep);
      // Remove dados inválidos do cache
      await supabase.from('zip_cache').delete().eq('cep', cep);
      return null;
    }

    return cepData;
  } catch (error) {
    console.error('[getCachedCep] Error:', error);
    return null;
  }
}

/**
 * Salva CEP no cache do Supabase apenas se for válido
 */
async function cacheCep(cepData: CepData): Promise<void> {
  try {
    // Só fazer cache se os dados forem válidos
    if (!isValidCepData(cepData)) {
      console.warn('[cacheCep] Não salvando dados inválidos no cache:', cepData);
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
        latitude: cepData.latitude,
        longitude: cepData.longitude,
        cached_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('[cacheCep] Error caching CEP:', error);
  }
}

/**
 * Busca CEP no ViaCEP com timeout
 */
async function fetchViaCep(cep: string): Promise<CepData | null> {
  try {
    console.log('[fetchViaCep] 🚀 Iniciando busca no ViaCEP para:', cep);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[fetchViaCep] ⏰ Timeout no ViaCEP após 5 segundos');
      controller.abort();
    }, 5000);

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('[fetchViaCep] ❌ Resposta não OK:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.erro) {
      console.warn('[fetchViaCep] ⚠️ ViaCEP retornou erro - CEP não encontrado:', cep);
      return null;
    }
    
    const cepData: CepData = {
      cep: cep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge,
      source: 'viacep' as const,
    };

    // Validar dados antes de retornar
    if (!isValidCepData(cepData)) {
      console.warn('[fetchViaCep] ⚠️ Dados inválidos retornados pelo ViaCEP:', cepData);
      return null;
    }
    
    console.log('[fetchViaCep] ✅ ViaCEP retornou dados válidos:', cepData);
    return cepData;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[fetchViaCep] ⏰ Timeout na busca do CEP ViaCEP:', cep);
    } else {
      console.error('[fetchViaCep] 💥 Erro no ViaCEP:', error);
    }
    return null;
  }
}

/**
 * Busca CEP no BrasilAPI com timeout
 */
async function fetchBrasilApi(cep: string): Promise<CepData | null> {
  try {
    console.log('[fetchBrasilApi] 🚀 Iniciando busca no BrasilAPI para:', cep);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[fetchBrasilApi] ⏰ Timeout no BrasilAPI após 5 segundos');
      controller.abort();
    }, 5000);

    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[fetchBrasilApi] ⚠️ BrasilAPI: CEP não encontrado (404):', cep);
      } else {
        console.error('[fetchBrasilApi] ❌ Resposta não OK:', response.status, response.statusText);
      }
      return null;
    }
    
    const data = await response.json();
    
    const cepData: CepData = {
      cep: cep,
      logradouro: data.street || '',
      bairro: data.neighborhood || '',
      localidade: data.city || '',
      uf: data.state || '',
      ibge: data.city_ibge,
      source: 'brasilapi' as const,
    };

    // Validar dados antes de retornar
    if (!isValidCepData(cepData)) {
      console.warn('[fetchBrasilApi] ⚠️ Dados inválidos retornados pelo BrasilAPI:', cepData);
      return null;
    }
    
    console.log('[fetchBrasilApi] ✅ BrasilAPI retornou dados válidos:', cepData);
    return cepData;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[fetchBrasilApi] ⏰ Timeout na busca do CEP BrasilAPI:', cep);
    } else {
      console.error('[fetchBrasilApi] 💥 Erro no BrasilAPI:', error);
    }
    return null;
  }
}

/**
 * Determina a zona de entrega baseada no código IBGE
 */
async function getDeliveryZone(ibge?: string): Promise<{ zona_entrega: string; prazo_entrega: string }> {
  try {
    // Buscar zonas de entrega no Supabase
    const { data: zones } = await supabase
      .from('delivery_zones')
      .select('*');

    if (!zones || !ibge) {
      return { zona_entrega: 'outras', prazo_entrega: 'frete a combinar (informado após o fechamento do pedido)' };
    }

    // Verificar se é Capelinha (IBGE: 3112307)
    const localZone = zones.find(zone => zone.ibge_code === ibge);
    if (localZone) {
      return { zona_entrega: localZone.zone_type, prazo_entrega: localZone.delivery_time };
    }

    // Default para outras localidades
    const defaultZone = zones.find(zone => zone.zone_type === 'outras');
    return { 
      zona_entrega: 'outras', 
      prazo_entrega: defaultZone?.delivery_time || 'frete a combinar (informado após o fechamento do pedido)' 
    };
  } catch (error) {
    console.error('[getDeliveryZone] Error:', error);
    return { zona_entrega: 'outras', prazo_entrega: 'frete a combinar (informado após o fechamento do pedido)' };
  }
}

/**
 * Função principal para buscar CEP - AGORA COM VALIDAÇÃO FLEXÍVEL
 */
export async function lookupCep(rawCep: string): Promise<CepData | null> {
  const cep = sanitizeCep(rawCep);
  
  if (!isValidCep(cep)) {
    console.warn('[lookupCep] Formato de CEP inválido:', rawCep);
    return null;
  }

  console.log('[lookupCep] 🔍 SISTEMA LEGADO - Recomenda-se usar enhancedCep.ts:', cep);

  try {
    // 1. Verificar cache primeiro
    console.log('[lookupCep] 📦 Verificando cache...');
    const cached = await getCachedCep(cep);
    if (cached) {
      console.log('[lookupCep] ✅ CEP encontrado no cache:', cep);
      const deliveryInfo = await getDeliveryZone(cached.ibge);
      return { ...cached, ...deliveryInfo };
    }

    // 2. Buscar nas APIs externas com validação flexível
    let cepData: CepData | null = null;
    
    // ViaCEP
    try {
      const viacepData = await fetchViaCep(cep);
      if (viacepData && isValidCepData(viacepData)) {
        console.log('[lookupCep] ✅ ViaCEP retornou dados válidos (flexível)');
        cepData = viacepData;
      }
    } catch (viacepError) {
      console.error('[lookupCep] ❌ Erro no ViaCEP:', viacepError);
    }
    
    // BrasilAPI se ViaCEP falhou
    if (!cepData) {
      try {
        const brasilApiData = await fetchBrasilApi(cep);
        if (brasilApiData && isValidCepData(brasilApiData)) {
          console.log('[lookupCep] ✅ BrasilAPI retornou dados válidos (flexível)');
          cepData = brasilApiData;
        }
      } catch (brasilApiError) {
        console.error('[lookupCep] ❌ Erro no BrasilAPI:', brasilApiError);
      }
    }

    if (cepData) {
      const deliveryInfo = await getDeliveryZone(cepData.ibge);
      const finalData = { ...cepData, ...deliveryInfo };
      await cacheCep(finalData);
      console.log('[lookupCep] ✅ CEP encontrado (sistema legado com validação flexível):', cep);
      return finalData;
    }

    console.warn('[lookupCep] ⚠️ SISTEMA LEGADO não encontrou CEP:', cep);
    return null;

  } catch (error) {
    console.error('[lookupCep] 💥 Erro inesperado na busca do CEP:', {
      cep,
      error: error?.message || error,
      stack: error?.stack
    });
    return null;
  }
}

/**
 * Busca coordenadas usando Nominatim (OpenStreetMap) - gratuito
 */
export async function getCoordinates(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error('[getCoordinates] Error:', error);
    return null;
  }
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatCep(cep: string): string {
  const sanitized = sanitizeCep(cep);
  if (sanitized.length !== 8) return cep;
  return `${sanitized.slice(0, 5)}-${sanitized.slice(5)}`;
}
