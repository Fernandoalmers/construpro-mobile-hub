
import { useCallback } from 'react';

export const useProductImageProcessing = () => {
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductImageProcessing] Processing raw images:', rawImages);
    
    if (!rawImages) {
      console.log('[useProductImageProcessing] No images provided - returning empty array');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        processedImages = rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
        console.log('[useProductImageProcessing] Raw images is already an array, filtered:', processedImages);
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          console.log('[useProductImageProcessing] Empty or invalid image string');
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
      
      // Simplified validation - accept any non-empty string that looks like a URL
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
        
        // Very permissive URL validation - accept anything that looks like a URL or path
        const isValidUrl = trimmed.length > 0;
        
        console.log('[useProductImageProcessing] URL validation for:', trimmed.substring(0, 100), 'isValid:', isValidUrl);
        
        if (!isValidUrl) {
          console.log('[useProductImageProcessing] Invalid URL format:', trimmed);
          return false;
        }
        
        console.log('[useProductImageProcessing] Valid image URL accepted:', trimmed.substring(0, 100) + '...');
        return true;
      });
      
      console.log('[useProductImageProcessing] Final valid images count:', validImages.length);
      console.log('[useProductImageProcessing] Final valid images:', validImages.map(url => url.substring(0, 100) + '...'));
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
