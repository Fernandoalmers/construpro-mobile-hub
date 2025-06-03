
/**
 * Safely extracts the first image URL from various image data formats
 * Handles: strings, arrays, nested arrays, and JSON strings
 * Enhanced version with better nested array handling
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
  
  let imageArray: string[] = [];
  
  // Handle string (could be JSON or single URL)
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
        imageArray = parsed;
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
  // Handle array
  else if (Array.isArray(imagens)) {
    console.log('[imageUtils] Processing array, length:', imagens.length);
    imageArray = imagens;
  }
  // Handle other types
  else {
    console.log('[imageUtils] ❌ Unsupported type:', typeof imagens);
    return null;
  }
  
  // Enhanced nested array handling with depth protection and better flattening
  let depth = 0;
  let currentArray = imageArray;
  
  while (depth < 10) { // Increased depth limit for safety
    // Check if we have any nested arrays
    const hasNestedArrays = currentArray.some(item => Array.isArray(item));
    
    if (!hasNestedArrays) {
      break; // No more nested arrays to flatten
    }
    
    console.log('[imageUtils] Flattening nested array at depth:', depth);
    
    // Flatten one level and filter out empty arrays
    const newArray = [];
    for (const item of currentArray) {
      if (Array.isArray(item)) {
        newArray.push(...item);
      } else {
        newArray.push(item);
      }
    }
    
    currentArray = newArray;
    depth++;
    
    // Safety check to prevent infinite loops
    if (depth >= 10) {
      console.error('[imageUtils] ❌ Too many nested arrays, stopping to prevent infinite loop');
      break;
    }
  }
  
  // Enhanced filtering with better validation
  const validImages = currentArray.filter((img, index) => {
    if (!img || typeof img !== 'string') {
      console.log(`[imageUtils] Skipping invalid item at index ${index}:`, img);
      return false;
    }
    
    const trimmed = img.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      console.log(`[imageUtils] Skipping empty/null item at index ${index}:`, trimmed);
      return false;
    }
    
    // Enhanced URL validation - more permissive for various URL formats
    const isValidUrl = trimmed.match(/^(https?:\/\/|blob:|data:image\/|\/)/);
    if (!isValidUrl) {
      console.log(`[imageUtils] Skipping invalid URL format at index ${index}:`, trimmed.substring(0, 50) + '...');
      return false;
    }
    
    console.log(`[imageUtils] ✅ Valid image at index ${index}:`, trimmed.substring(0, 50) + '...');
    return true;
  });
  
  const result = validImages.length > 0 ? validImages[0] : null;
  console.log('[imageUtils] Final result:', result ? result.substring(0, 50) + '...' : 'null');
  
  return result;
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
        
        // Check for deeply nested arrays
        if (Array.isArray(imageData[0]) && imageData[0].length > 0) {
          console.log('Second level element:', imageData[0][0]);
          console.log('Second level element type:', typeof imageData[0][0]);
        }
      }
    }
    console.log('Stringified:', JSON.stringify(imageData));
    console.log('Result from safeFirstImage:', safeFirstImage(imageData));
    console.groupEnd();
  }
}
