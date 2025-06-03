
import { useState } from 'react';

export const useProductImageState = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const initializeImageStates = (processedImages: string[]) => {
    console.log('[useProductImageState] Setting image states with:', processedImages.length, 'images');
    
    // Create completely separate arrays for each state
    const existingImagesCopy = [...processedImages];
    const imagePreviewsCopy = [...processedImages];
    
    setExistingImages(existingImagesCopy);
    setImagePreviews(imagePreviewsCopy);
    setImageFiles([]); // No new files when editing existing product
    
    console.log('[useProductImageState] Image states set successfully:');
    console.log('[useProductImageState] - existingImages:', existingImagesCopy.length);
    console.log('[useProductImageState] - imagePreviews:', imagePreviewsCopy.length);
    console.log('[useProductImageState] - imageFiles:', 0);
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
