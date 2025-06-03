
import { useCallback } from 'react';

export const useProductImageProcessing = () => {
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductImageProcessing] Processing raw images:', rawImages);
    console.log('[useProductImageProcessing] Type of rawImages:', typeof rawImages);
    
    if (!rawImages) {
      console.log('[useProductImageProcessing] No images provided - returning empty array');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        console.log('[useProductImageProcessing] Raw images is already an array:', rawImages);
        processedImages = rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
        console.log('[useProductImageProcessing] Filtered array images:', processedImages);
      } else if (typeof rawImages === 'string') {
        console.log('[useProductImageProcessing] Raw images is a string:', rawImages);
        
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          console.log('[useProductImageProcessing] Empty or invalid image string');
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          console.log('[useProductImageProcessing] Parsed JSON:', parsed);
          if (Array.isArray(parsed)) {
            processedImages = parsed.filter(img => img && typeof img === 'string' && img.trim() !== '');
          } else {
            processedImages = [rawImages];
          }
        } catch (e) {
          console.log('[useProductImageProcessing] Not JSON, treating as single URL');
          // If not JSON, treat as single URL
          processedImages = [rawImages];
        }
      } else {
        console.log('[useProductImageProcessing] Unexpected image type:', typeof rawImages);
        return [];
      }
      
      // Very basic validation - just check if it's a non-empty string
      const validImages = processedImages.filter(img => {
        if (!img || typeof img !== 'string') {
          console.log('[useProductImageProcessing] Invalid image (not string):', img);
          return false;
        }
        
        const trimmed = img.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          console.log('[useProductImageProcessing] Empty or null image string:', trimmed);
          return false;
        }
        
        console.log('[useProductImageProcessing] Valid image URL accepted:', trimmed.substring(0, 100) + '...');
        return true;
      });
      
      console.log('[useProductImageProcessing] Final valid images count:', validImages.length);
      console.log('[useProductImageProcessing] Final valid images:', validImages);
      return validImages;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return {
    processImages
  };
};
