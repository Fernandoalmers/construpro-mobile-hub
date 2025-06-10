
import { parseImageData } from './imageParser';

/**
 * Safely extracts the first image URL from various image data formats
 * This is a wrapper around the enhanced parseImageData function for backward compatibility
 */
export function safeFirstImage(imagens: any): string | null {
  const parseResult = parseImageData(imagens);
  return parseResult.urls.length > 0 ? parseResult.urls[0] : null;
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
    const parseResult = parseImageData(imageData);
    
    console.group(`[DEBUG] Image data for "${productName}" ${context}`);
    console.log('Raw data:', imageData);
    console.log('Parse result:', parseResult);
    console.log('Extracted URLs:', parseResult.urls);
    console.log('Parse errors:', parseResult.errors);
    console.log('Original format:', parseResult.originalFormat);
    console.log('Needs correction:', parseResult.errors.length > 0);
    console.groupEnd();
  }
}
