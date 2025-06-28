/**
 * Utilities for handling avatar URLs and validation
 */

/**
 * Validates if an avatar URL is accessible and valid
 */
export const validateAvatarUrl = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch {
    console.log('[AvatarUtils] Invalid URL format:', url);
    return false;
  }

  // Check if URL is accessible (with timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    
    const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/');
    console.log('[AvatarUtils] URL validation result:', { url, isValid, status: response.status });
    
    return isValid;
  } catch (error) {
    console.log('[AvatarUtils] URL validation failed:', { url, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
};

/**
 * Generates a safe avatar URL with fallback handling
 */
export const getSafeAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return undefined;
  }

  // Remove potential query parameters that might cause issues
  try {
    const url = new URL(avatarUrl);
    // Keep only essential query parameters
    const allowedParams = ['t', 'token'];
    const searchParams = new URLSearchParams();
    
    allowedParams.forEach(param => {
      if (url.searchParams.has(param)) {
        searchParams.set(param, url.searchParams.get(param)!);
      }
    });
    
    url.search = searchParams.toString();
    return url.toString();
  } catch {
    // If URL parsing fails, return the original (might still work)
    return avatarUrl;
  }
};

/**
 * Adds cache busting parameter to avatar URL
 */
export const addCacheBuster = (url: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('cb', Date.now().toString());
    return urlObj.toString();
  } catch {
    // If URL parsing fails, append query parameter manually
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
  }
};
