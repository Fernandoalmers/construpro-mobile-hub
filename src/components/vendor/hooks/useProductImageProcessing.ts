
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
      } else if (typeof rawImages === 'string') {
        console.log('[useProductImageProcessing] Raw images is a string:', rawImages);
        
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
      } else {
        console.log('[useProductImageProcessing] Unexpected image type:', typeof rawImages);
        return [];
      }
      
      // Validate URLs - be more permissive with Supabase storage URLs
      const validImages = processedImages.filter(img => {
        if (!img || typeof img !== 'string') {
          return false;
        }
        
        const trimmed = img.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          return false;
        }
        
        // Accept any reasonable URL format
        const isValidUrl = trimmed.includes('http') || 
                          trimmed.includes('supabase') || 
                          trimmed.includes('storage') ||
                          trimmed.includes('blob:') ||
                          trimmed.length > 10;
        
        console.log('[useProductImageProcessing] Image validation result for:', trimmed.substring(0, 50) + '...', 'Valid:', isValidUrl);
        return isValidUrl;
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
