/**
 * Safely extracts the first image URL from various image data formats
 * Handles: strings, arrays, nested arrays, and JSON strings
 * Enhanced version with better validation and logging
 */
export function safeFirstImage(imagens: any): string | null {
  if (!imagens) {
    console.log('[imageUtils] No images provided');
    return null;
  }
  
  console.log('[imageUtils] Processing images:', { 
    type: typeof imagens, 
    value: imagens,
    isArray: Array.isArray(imagens),
    stringified: JSON.stringify(imagens).substring(0, 100)
  });
  
  // Handle string input
  if (typeof imagens === 'string') {
    // Skip if it's already a blob URL or looks like a single URL
    if (imagens.startsWith('blob:') || imagens.startsWith('http') || imagens.startsWith('data:')) {
      console.log('[imageUtils] ✅ Direct URL string:', imagens.substring(0, 50) + '...');
      return imagens;
    }
    
    try {
      const parsed = JSON.parse(imagens);
      console.log('[imageUtils] Parsed JSON string:', parsed);
      
      if (Array.isArray(parsed)) {
        return safeFirstImage(parsed); // Recursively process the parsed array
      } else if (typeof parsed === 'string') {
        console.log('[imageUtils] ✅ Single URL from JSON string:', parsed.substring(0, 50) + '...');
        return parsed;
      }
    } catch {
      // If not valid JSON, treat as single URL
      const cleanUrl = imagens.trim();
      if (cleanUrl !== '' && cleanUrl !== 'null' && cleanUrl !== 'undefined') {
        console.log('[imageUtils] ✅ Non-JSON string as URL:', cleanUrl.substring(0, 50) + '...');
        return cleanUrl;
      }
      console.log('[imageUtils] ❌ Invalid string, skipping');
      return null;
    }
  }
  
  // Handle array input
  if (Array.isArray(imagens)) {
    console.log('[imageUtils] Processing array, length:', imagens.length);
    
    if (imagens.length === 0) {
      console.log('[imageUtils] ❌ Empty array');
      return null;
    }
    
    // Process each item in the array
    for (let i = 0; i < imagens.length; i++) {
      const item = imagens[i];
      
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
          // Enhanced URL validation
          const isValidUrl = trimmed.match(/^(https?:\/\/|blob:|data:image\/|\/)/);
          if (isValidUrl) {
            console.log(`[imageUtils] ✅ Valid URL found at index ${i}:`, trimmed.substring(0, 50) + '...');
            return trimmed;
          } else {
            console.log(`[imageUtils] ⚠️ Invalid URL format at index ${i}:`, trimmed.substring(0, 50));
          }
        }
      } else if (Array.isArray(item)) {
        // Handle nested arrays (should be rare after SQL fix, but keeping for safety)
        console.log(`[imageUtils] ⚠️ Found nested array at index ${i}, processing recursively`);
        const nestedResult = safeFirstImage(item);
        if (nestedResult) {
          console.log(`[imageUtils] ✅ Found URL in nested array:`, nestedResult.substring(0, 50) + '...');
          return nestedResult;
        }
      } else if (item && typeof item === 'object') {
        // Handle object with url property
        const url = item.url || item.path || item.src;
        if (url && typeof url === 'string') {
          const trimmed = String(url).trim();
          if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
            console.log(`[imageUtils] ✅ URL from object at index ${i}:`, trimmed.substring(0, 50) + '...');
            return trimmed;
          }
        }
      }
    }
    
    console.log('[imageUtils] ❌ No valid URLs found in array');
    return null;
  }
  
  // Handle object input
  if (imagens && typeof imagens === 'object') {
    const url = imagens.url || imagens.path || imagens.src;
    if (url && typeof url === 'string') {
      const trimmed = String(url).trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
        console.log('[imageUtils] ✅ URL from object:', trimmed.substring(0, 50) + '...');
        return trimmed;
      }
    }
    console.log('[imageUtils] ❌ Object has no valid URL property');
    return null;
  }
  
  console.log('[imageUtils] ❌ Unsupported type:', typeof imagens);
  return null;
}

/**
 * Handles image error by setting a local placeholder
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = event.currentTarget;
  const originalSrc = target.src;
  
  console.log('[imageUtils] Image load error for:', originalSrc);
  
  target.onerror = null; // Prevent infinite loop
  target.src = '/img/placeholder.png';
  target.alt = 'Imagem não encontrada';
  
  console.log('[imageUtils] Set placeholder image');
}

/**
 * Enhanced debug logging for image processing in development
 */
export function debugImageData(productName: string, imageData: any, context: string = '') {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[DEBUG] Image data for "${productName}" ${context}`);
    console.log('Raw data:', imageData);
    console.log('Type:', typeof imageData);
    console.log('Is array:', Array.isArray(imageData));
    if (Array.isArray(imageData)) {
      console.log('Array length:', imageData.length);
      if (imageData.length > 0) {
        console.log('First element:', imageData[0]);
        console.log('First element type:', typeof imageData[0]);
        console.log('Is first element array:', Array.isArray(imageData[0]));
      }
    }
    console.log('Stringified:', JSON.stringify(imageData));
    console.log('Result from safeFirstImage:', safeFirstImage(imageData));
    console.groupEnd();
  }
}
