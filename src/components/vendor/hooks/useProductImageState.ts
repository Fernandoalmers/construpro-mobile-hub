
import { useState } from 'react';

export const useProductImageState = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const initializeImageStates = (processedImages: string[]) => {
    console.log('[useProductImageState] Initializing with processed images:', processedImages);
    console.log('[useProductImageState] Number of images to initialize:', processedImages.length);
    
    if (!Array.isArray(processedImages)) {
      console.error('[useProductImageState] processedImages is not an array:', processedImages);
      return;
    }
    
    // Set states directly with the processed images
    setExistingImages([...processedImages]);
    setImagePreviews([...processedImages]);
    setImageFiles([]); // No new files when editing existing product
    
    console.log('[useProductImageState] Image states initialized:');
    console.log('[useProductImageState] - existingImages set to:', processedImages.length, 'items');
    console.log('[useProductImageState] - imagePreviews set to:', processedImages.length, 'items');
    console.log('[useProductImageState] - imageFiles set to: 0 items');
  };

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
