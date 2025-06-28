
/**
 * Utilities for handling avatar URLs and validation
 */

// Cache para URLs validadas (evita validações repetidas)
const validatedUrls = new Map<string, { isValid: boolean; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Valida se um avatar URL é acessível
 */
export const validateAvatarUrl = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Verificar cache primeiro
  const cached = validatedUrls.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('🔄 [AvatarUtils] Usando cache para URL:', url, 'válida:', cached.isValid);
    return cached.isValid;
  }

  // URLs do Supabase são sempre válidas por padrão
  if (url.includes('supabase') || url.includes('.supabase.co')) {
    console.log('✅ [AvatarUtils] URL do Supabase considerada válida:', url);
    validatedUrls.set(url, { isValid: true, timestamp: Date.now() });
    return true;
  }

  // Validação básica de formato para outras URLs
  try {
    new URL(url);
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
    validatedUrls.set(url, { isValid: isImageUrl, timestamp: Date.now() });
    console.log('🔍 [AvatarUtils] URL validada:', url, 'é imagem:', isImageUrl);
    return isImageUrl;
  } catch {
    console.log('❌ [AvatarUtils] URL inválida:', url);
    validatedUrls.set(url, { isValid: false, timestamp: Date.now() });
    return false;
  }
};

/**
 * Retorna uma URL de avatar segura - SIMPLIFICADA
 * Para URLs do Supabase, retorna como está. Para outras, faz limpeza básica.
 */
export const getSafeAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    console.log('🚫 [AvatarUtils] Avatar URL vazia ou inválida');
    return undefined;
  }

  // URLs do Supabase são retornadas como estão
  if (avatarUrl.includes('supabase') || avatarUrl.includes('.supabase.co')) {
    console.log('✅ [AvatarUtils] URL do Supabase retornada sem modificação:', avatarUrl);
    return avatarUrl;
  }

  // Para outras URLs, fazer limpeza básica
  try {
    const url = new URL(avatarUrl);
    console.log('🔧 [AvatarUtils] URL externa processada:', url.toString());
    return url.toString();
  } catch {
    console.log('⚠️ [AvatarUtils] Retornando URL original devido a erro de parsing:', avatarUrl);
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
    urlObj.searchParams.set('t', Date.now().toString());
    console.log('🔄 [AvatarUtils] Cache buster adicionado:', urlObj.toString());
    return urlObj.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const result = `${url}${separator}t=${Date.now()}`;
    console.log('🔄 [AvatarUtils] Cache buster adicionado (fallback):', result);
    return result;
  }
};

/**
 * Limpa o cache de URLs validadas
 */
export const clearAvatarCache = (): void => {
  validatedUrls.clear();
  console.log('🗑️ [AvatarUtils] Cache de avatares limpo');
};
