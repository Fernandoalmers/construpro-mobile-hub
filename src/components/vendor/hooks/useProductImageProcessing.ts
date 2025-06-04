
import { useCallback } from 'react';
import { safeFirstImage, debugImageData } from '@/utils/imageUtils';

export const useProductImageProcessing = () => {
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductImageProcessing] Starting image processing');
    debugImageData('Raw Images Input', rawImages, 'in useProductImageProcessing');
    
    if (!rawImages) {
      console.log('[useProductImageProcessing] No images provided');
      return [];
    }

    const result: string[] = [];
    
    try {
      // Handle array input - process each element
      if (Array.isArray(rawImages)) {
        console.log('[useProductImageProcessing] Processing array, length:', rawImages.length);
        
        rawImages.forEach((item, index) => {
          const extractedUrl = safeFirstImage(item);
          if (extractedUrl) {
            console.log(`[useProductImageProcessing] ✅ Extracted URL from index ${index}:`, extractedUrl.substring(0, 50) + '...');
            result.push(extractedUrl);
          } else {
            console.log(`[useProductImageProcessing] ❌ No valid URL from index ${index}`);
          }
        });
      } else {
        // For non-array inputs, try to extract URL(s)
        const extractedUrl = safeFirstImage(rawImages);
        if (extractedUrl) {
          console.log('[useProductImageProcessing] ✅ Extracted single URL:', extractedUrl.substring(0, 50) + '...');
          result.push(extractedUrl);
        } else {
          console.log('[useProductImageProcessing] ❌ No valid URL extracted from input');
        }
      }
      
      // Remove duplicates and validate URLs
      const uniqueUrls = Array.from(new Set(result)).filter(url => {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim();
        return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
      });
      
      console.log('[useProductImageProcessing] Final processed images count:', uniqueUrls.length);
      uniqueUrls.forEach((img, index) => {
        console.log(`[useProductImageProcessing] Final image ${index}:`, img.substring(0, 80) + '...');
      });
      
      return uniqueUrls;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return { processImages };
};
