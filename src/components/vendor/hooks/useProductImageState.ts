
import { useState } from 'react';

export const useProductImageState = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const initializeImageStates = (processedImages: string[]) => {
    console.log('[useProductImageState] Initializing with processed images:', processedImages);
    console.log('[useProductImageState] Number of images to initialize:', processedImages?.length || 0);
    
    if (!Array.isArray(processedImages)) {
      console.error('[useProductImageState] processedImages is not an array:', processedImages);
      return;
    }
    
    // Create a copy to avoid reference issues
    const imagesCopy = [...processedImages];
    
    console.log('[useProductImageState] Setting states with images:', imagesCopy);
    
    // Set all states
    setExistingImages(imagesCopy);
    setImagePreviews(imagesCopy); 
    setImageFiles([]); // Clear any new files when editing existing product
    
    console.log('[useProductImageState] Image states initialized successfully');
    console.log('[useProductImageState] - existingImages set to:', imagesCopy.length, 'items');
    console.log('[useProductImageState] - imagePreviews set to:', imagesCopy.length, 'items');
    console.log('[useProductImageState] - imageFiles cleared');
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
