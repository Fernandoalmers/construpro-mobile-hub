
import { useState, useCallback } from 'react';

export const useProductImageState = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const initializeImageStates = useCallback((processedImages: string[]) => {
    console.log('[useProductImageState] Initializing with processed images:', processedImages);
    
    if (!Array.isArray(processedImages)) {
      console.error('[useProductImageState] processedImages is not an array:', processedImages);
      return;
    }
    
    // Clear any existing state first
    setImageFiles([]);
    
    // Set both existing images and previews to the same data
    setExistingImages(processedImages);
    setImagePreviews(processedImages);
    
    console.log('[useProductImageState] Image states initialized:', {
      existingImages: processedImages.length,
      imagePreviews: processedImages.length,
      imageFiles: 0
    });
  }, []);

  return {
    imageFiles,
    setImageFiles,
    imagePreviews,
    setImagePreviews,
    existingImages,
    setExistingImages,
    initializeImageStates
  };
};
