
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

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        console.log('[useProductImageProcessing] Processing array, length:', rawImages.length);
        
        // Enhanced nested array detection and flattening
        let currentArray = rawImages;
        let flattenDepth = 0;
        
        // Safely flatten nested arrays with depth limit
        while (currentArray.length > 0 && Array.isArray(currentArray[0]) && flattenDepth < 5) {
          console.log('[useProductImageProcessing] Flattening nested array at depth:', flattenDepth);
          currentArray = currentArray.flat();
          flattenDepth++;
        }
        
        if (flattenDepth >= 5) {
          console.error('[useProductImageProcessing] Too many nested arrays, stopping to prevent infinite loop');
          return [];
        }
        
        processedImages = currentArray.filter((img, index) => {
          if (!img || typeof img !== 'string') {
            console.log(`[useProductImageProcessing] Skipping invalid item at index ${index}:`, img);
            return false;
          }
          
          const trimmed = img.trim();
          const isValid = trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined';
          
          if (!isValid) {
            console.log(`[useProductImageProcessing] Skipping empty/invalid item at index ${index}:`, trimmed);
          } else {
            console.log(`[useProductImageProcessing] ✅ Valid image at index ${index}:`, trimmed.substring(0, 50) + '...');
          }
          
          return isValid;
        });
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          console.log('[useProductImageProcessing] Empty string provided');
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          console.log('[useProductImageProcessing] Parsed JSON string:', parsed);
          
          if (Array.isArray(parsed)) {
            // Recursively process the parsed array
            return processImages(parsed);
          } else if (typeof parsed === 'string') {
            processedImages = [parsed];
          }
        } catch (e) {
          // If not JSON, treat as single URL
          console.log('[useProductImageProcessing] Treating as single URL string');
          processedImages = [rawImages];
        }
      } else {
        console.log('[useProductImageProcessing] Unsupported data type:', typeof rawImages);
        return [];
      }
      
      // Enhanced validation with URL format checking
      const validImages = processedImages.filter((img, index) => {
        if (!img || typeof img !== 'string') {
          console.log(`[useProductImageProcessing] Final filter: skipping non-string at ${index}:`, img);
          return false;
        }
        
        const trimmed = img.trim();
        
        // Basic validation
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          console.log(`[useProductImageProcessing] Final filter: skipping empty at ${index}:`, trimmed);
          return false;
        }
        
        // Enhanced URL validation
        const isValidUrl = trimmed.match(/^(https?:\/\/|blob:|data:image\/)/);
        if (!isValidUrl) {
          console.log(`[useProductImageProcessing] Final filter: invalid URL format at ${index}:`, trimmed.substring(0, 50) + '...');
          return false;
        }
        
        console.log(`[useProductImageProcessing] ✅ Final validation passed for ${index}:`, trimmed.substring(0, 50) + '...');
        return true;
      });
      
      console.log('[useProductImageProcessing] Final processed images count:', validImages.length);
      validImages.forEach((img, index) => {
        console.log(`[useProductImageProcessing] Final image ${index}:`, img.substring(0, 80) + '...');
      });
      
      return validImages;
      
    } catch (error) {
      console.error('[useProductImageProcessing] Error processing images:', error);
      return [];
    }
  }, []);

  return { processImages };
};
