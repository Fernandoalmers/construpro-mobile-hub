/**
 * Utilities for CEP formatting and validation
 */

/**
 * Interface para dados de CEP
 */
export interface CepData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
}

/**
 * OVERRIDE DEFINITIVO para CEP 39688-000 - SEMPRE retorna Angelândia-MG
 */
const getDefinitiveCepOverride = (cep: string): CepData | null => {
  if (cep === '39688000') {
    console.log('[cep.ts] 🎯 OVERRIDE DEFINITIVO: CEP 39688-000 -> Angelândia-MG');
    return {
      cep: '39688000',
      logradouro: 'Endereço não especificado',
      bairro: 'Centro',
      localidade: 'Angelândia',
      uf: 'MG',
      ibge: '3102803'
    };
  }
  return null;
};

export const formatCep = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 8 digits
  const limitedDigits = digits.slice(0, 8);
  
  // Format as XXXXX-XXX
  if (limitedDigits.length <= 5) {
    return limitedDigits;
  } else {
    return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
  }
};

export const validateCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
};

export const sanitizeCep = (cep: string): string => {
  return cep.replace(/\D/g, '');
};

/**
 * Busca CEP com override definitivo para CEP 39688-000
 */
export const lookupCep = async (cep: string): Promise<CepData | null> => {
  const cleanCep = sanitizeCep(cep);
  
  // 🎯 OVERRIDE DEFINITIVO PRIMEIRO - intercepta CEP 39688-000 antes de qualquer consulta
  const overrideResult = getDefinitiveCepOverride(cleanCep);
  if (overrideResult) {
    console.log('[cep.ts] ✅ OVERRIDE DEFINITIVO APLICADO:', overrideResult);
    return overrideResult;
  }
  
  console.log('[cep.ts] Buscando CEP:', cleanCep);
  
  if (!validateCep(cleanCep)) {
    throw new Error('CEP inválido');
  }

  try {
    // Try ViaCEP first
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return {
      cep: cleanCep,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ibge: data.ibge
    };
  } catch (error) {
    console.error('[cep.ts] Erro na busca:', error);
    
    // Fallback para BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      const data = await response.json();
      
      return {
        cep: cleanCep,
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        localidade: data.city || '',
        uf: data.state || '',
        ibge: data.city_ibge
      };
    } catch (fallbackError) {
      console.error('[cep.ts] Erro no fallback:', fallbackError);
      throw new Error('CEP não encontrado em nenhuma base de dados');
    }
  }
};

/**
 * Busca múltiplos CEPs
 */
export const lookupMultipleCeps = async (ceps: string[]) => {
  const results = await Promise.allSettled(
    ceps.map(cep => lookupCep(cep))
  );
  
  return results.map((result, index) => ({
    cep: ceps[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
};
