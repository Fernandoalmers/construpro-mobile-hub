
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

    // Use the enhanced safeFirstImage function to extract all valid URLs
    const result: string[] = [];
    
    try {
      // If it's already an array, process each item
      if (Array.isArray(rawImages)) {
        console.log('[useProductImageProcessing] Processing array, length:', rawImages.length);
        
        // Process each element in the array
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
        // For non-array inputs, try to extract a single URL
        const extractedUrl = safeFirstImage(rawImages);
        if (extractedUrl) {
          console.log('[useProductImageProcessing] ✅ Extracted single URL:', extractedUrl.substring(0, 50) + '...');
          result.push(extractedUrl);
        } else {
          console.log('[useProductImageProcessing] ❌ No valid URL extracted from input');
        }
      }
      
      console.log('[useProductImageProcessing] Final processed images count:', result.length);
      result.forEach((img, index) => {
        console.log(`[useProductImageProcessing] Final image ${index}:`, img.substring(0, 80) + '...');
      });
      
      return result;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return { processImages };
};
