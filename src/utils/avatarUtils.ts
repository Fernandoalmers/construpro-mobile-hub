
/**
 * Utilities for handling avatar URLs and validation
 */

// Cache para URLs validadas (evita validações repetidas)
const validatedUrls = new Map<string, { isValid: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Valida se um avatar URL é acessível - versão simplificada
 */
export const validateAvatarUrl = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Verificar cache primeiro
  const cached = validatedUrls.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.isValid;
  }

  // Validação básica de formato
  try {
    new URL(url);
  } catch {
    console.log('[AvatarUtils] URL inválida:', url);
    validatedUrls.set(url, { isValid: false, timestamp: Date.now() });
    return false;
  }

  // Verificar se é uma URL de imagem válida (sem fazer fetch)
  const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || 
                     url.includes('supabase') || 
                     url.includes('storage');

  validatedUrls.set(url, { isValid: isImageUrl, timestamp: Date.now() });
  return isImageUrl;
};

/**
 * Gera uma URL de avatar segura
 */
export const getSafeAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return undefined;
  }

  try {
    const url = new URL(avatarUrl);
    
    // Se for do Supabase, manter como está
    if (url.hostname.includes('supabase')) {
      return avatarUrl;
    }
    
    // Para outras URLs, limpar parâmetros desnecessários
    const allowedParams = ['t', 'token', 'v'];
    const searchParams = new URLSearchParams();
    
    allowedParams.forEach(param => {
      if (url.searchParams.has(param)) {
        searchParams.set(param, url.searchParams.get(param)!);
      }
    });
    
    url.search = searchParams.toString();
    return url.toString();
  } catch {
    // Se não conseguir parsear, retornar a URL original
    return avatarUrl;
  }
};

/**
 * Adiciona cache busting apenas quando necessário
 */
export const addCacheBuster = (url: string, force: boolean = false): string => {
  if (!force) return url;
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('cb', Date.now().toString());
    return urlObj.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
  }
};

/**
 * Limpa o cache de URLs validadas
 */
export const clearAvatarCache = (): void => {
  validatedUrls.clear();
  console.log('[AvatarUtils] Cache de avatares limpo');
};
