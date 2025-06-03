
import { useCallback } from 'react';

export const useProductImageProcessing = () => {
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductImageProcessing] Processing raw images:', rawImages);
    console.log('[useProductImageProcessing] Raw images type:', typeof rawImages);
    
    if (!rawImages) {
      console.log('[useProductImageProcessing] No images provided');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        console.log('[useProductImageProcessing] Raw images is array, length:', rawImages.length);
        
        // Check if it's a double array format [["url"]]
        if (rawImages.length > 0 && Array.isArray(rawImages[0])) {
          console.log('[useProductImageProcessing] Detected double array format, flattening...');
          processedImages = rawImages.flat().filter(img => img && typeof img === 'string' && img.trim() !== '');
        } else {
          // Simple array format ["url"]
          processedImages = rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
        }
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          console.log('[useProductImageProcessing] Parsed JSON:', parsed);
          
          if (Array.isArray(parsed)) {
            // Check if it's a double array format [["url"]]
            if (parsed.length > 0 && Array.isArray(parsed[0])) {
              console.log('[useProductImageProcessing] Detected double array in JSON, flattening...');
              processedImages = parsed.flat().filter(img => img && typeof img === 'string' && img.trim() !== '');
            } else {
              // Simple array format ["url"]
              processedImages = parsed.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }
          } else {
            processedImages = [rawImages];
          }
        } catch (e) {
          // If not JSON, treat as single URL
          processedImages = [rawImages];
        }
      }
      
      // Simple validation - accept any non-empty string that looks like a URL
      const validImages = processedImages.filter(img => {
        if (!img || typeof img !== 'string') return false;
        const trimmed = img.trim();
        return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
      });
      
      console.log('[useProductImageProcessing] Final processed images:', validImages);
      return validImages;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return { processImages };
};
