
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
  zona_entrega?: 'local' | 'regional' | 'outras';
  prazo_entrega?: string;
};

export type DeliveryZone = {
  zone_type: string;
  zone_name: string;
  ibge_code: string | null;
  delivery_time: string;
};

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

    return {
      cep: data.cep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
    };
  } catch (error) {
    console.error('[getCachedCep] Error:', error);
    return null;
  }
}

/**
 * Salva CEP no cache do Supabase
 */
async function cacheCep(cepData: CepData): Promise<void> {
  try {
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
 * Busca CEP no ViaCEP
 */
async function fetchViaCep(cep: string): Promise<CepData | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return {
      cep: cep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge,
    };
  } catch (error) {
    console.error('[fetchViaCep] Error:', error);
    return null;
  }
}

/**
 * Busca CEP no BrasilAPI
 */
async function fetchBrasilApi(cep: string): Promise<CepData | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      cep: cep,
      logradouro: data.street || '',
      bairro: data.neighborhood || '',
      localidade: data.city || '',
      uf: data.state || '',
      ibge: data.city_ibge,
    };
  } catch (error) {
    console.error('[fetchBrasilApi] Error:', error);
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
 * Função principal para buscar CEP com fallbacks e cache
 */
export async function lookupCep(rawCep: string): Promise<CepData | null> {
  const cep = sanitizeCep(rawCep);
  
  if (!isValidCep(cep)) {
    console.warn('[lookupCep] Invalid CEP format:', rawCep);
    return null;
  }

  console.log('[lookupCep] Looking up CEP:', cep);

  // 1. Verificar cache primeiro
  const cached = await getCachedCep(cep);
  if (cached) {
    console.log('[lookupCep] Found in cache:', cep);
    const deliveryInfo = await getDeliveryZone(cached.ibge);
    return { ...cached, ...deliveryInfo };
  }

  // 2. Tentar ViaCEP
  let cepData = await fetchViaCep(cep);
  
  // 3. Se falhar, tentar BrasilAPI
  if (!cepData) {
    cepData = await fetchBrasilApi(cep);
  }

  // Se ainda não encontrou, retornar null
  if (!cepData) {
    console.warn('[lookupCep] CEP not found:', cep);
    return null;
  }

  // Determinar zona de entrega
  const deliveryInfo = await getDeliveryZone(cepData.ibge);
  const finalData = { ...cepData, ...deliveryInfo };

  // Salvar no cache para próximas consultas
  await cacheCep(finalData);

  console.log('[lookupCep] CEP found and cached:', cep);
  return finalData;
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
