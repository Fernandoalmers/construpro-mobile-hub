
/**
 * Safely extracts the first image URL from various image data formats
 * Handles: strings, arrays, nested arrays, and JSON strings
 */
export function safeFirstImage(imagens: any): string | null {
  if (!imagens) return null;
  
  let imageArray: string[] = [];
  
  // Handle string (could be JSON or single URL)
  if (typeof imagens === 'string') {
    // Skip if it's already a blob URL or looks like a single URL
    if (imagens.startsWith('blob:') || imagens.startsWith('http')) {
      return imagens;
    }
    
    try {
      const parsed = JSON.parse(imagens);
      if (Array.isArray(parsed)) {
        imageArray = parsed;
      } else if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      // If not valid JSON, treat as single URL
      return imagens.trim() !== '' ? imagens : null;
    }
  } 
  // Handle array
  else if (Array.isArray(imagens)) {
    imageArray = imagens;
  }
  // Handle other types
  else {
    return null;
  }
  
  // Flatten nested arrays recursively until we get strings
  while (imageArray.length > 0 && Array.isArray(imageArray[0])) {
    imageArray = imageArray.flat();
  }
  
  // Filter out invalid URLs and return first valid one
  const validImages = imageArray.filter(img => 
    img && 
    typeof img === 'string' && 
    img.trim() !== '' && 
    img !== 'null' && 
    img !== 'undefined'
  );
  
  return validImages.length > 0 ? validImages[0] : null;
}

/**
 * Handles image error by setting a local placeholder
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = event.currentTarget;
  target.onerror = null; // Prevent infinite loop
  target.src = '/img/placeholder.png';
  target.alt = 'Imagem não encontrada';
}
