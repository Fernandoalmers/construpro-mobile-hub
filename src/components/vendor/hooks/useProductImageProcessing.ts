
import { useCallback } from 'react';

export const useProductImageProcessing = () => {
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductImageProcessing] Processing raw images:', rawImages);
    
    if (!rawImages) {
      console.log('[useProductImageProcessing] No images provided');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        processedImages = rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          if (Array.isArray(parsed)) {
            processedImages = parsed.filter(img => img && typeof img === 'string' && img.trim() !== '');
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
      
      console.log('[useProductImageProcessing] Processed images:', validImages);
      return validImages;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return { processImages };
};
