
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductFormData } from './useProductFormData';
import { useProductImageState } from './useProductImageState';
import { useProductImageProcessing } from './useProductImageProcessing';

interface UseProductFormStateProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

export const useProductFormState = ({ isEditing = false, productId, initialData }: UseProductFormStateProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const {
    formData,
    setFormData,
    currentSegmentId,
    handleInputChange,
    handleSegmentIdChange,
    handleSegmentNameChange,
    handleCategoryChange,
    initializeFormData
  } = useProductFormData(initialData);

  const {
    imageFiles,
    setImageFiles,
    imagePreviews,
    setImagePreviews,
    existingImages,
    setExistingImages,
    initializeImageStates
  } = useProductImageState();

  const { processImages } = useProductImageProcessing();

  // Initialize form data with improved image handling
  useEffect(() => {
    console.log('[useProductFormState] useEffect triggered with initialData:', !!initialData);
    
    if (initialData) {
      console.log('[useProductFormState] Initializing with data:', initialData);
      console.log('[useProductFormState] Raw images from initialData:', initialData.imagens);
      console.log('[useProductFormState] Type of initialData.imagens:', typeof initialData.imagens);
      
      // Process images first
      const processedImages = processImages(initialData.imagens);
      console.log('[useProductFormState] Processed images result:', processedImages);
      console.log('[useProductFormState] Processed images count:', processedImages.length);
      
      // Initialize form data first
      initializeFormData(initialData, processedImages);
      
      // Then initialize image states
      console.log('[useProductFormState] About to initialize image states with:', processedImages);
      initializeImageStates(processedImages);
      
      console.log('[useProductFormState] Initialization complete');
    } else {
      console.log('[useProductFormState] No initialData provided');
    }
  }, [initialData, processImages, initializeFormData, initializeImageStates]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('[useProductFormState] State changed - imagePreviews:', imagePreviews.length);
    console.log('[useProductFormState] State changed - existingImages:', existingImages.length);
    console.log('[useProductFormState] State changed - imageFiles:', imageFiles.length);
  }, [imagePreviews, existingImages, imageFiles]);

  return {
    loading,
    setLoading,
    uploadingImages,
    setUploadingImages,
    currentSegmentId,
    formData,
    setFormData,
    imageFiles,
    setImageFiles,
    imagePreviews,
    setImagePreviews,
    existingImages,
    setExistingImages,
    handleInputChange,
    handleSegmentIdChange,
    handleSegmentNameChange,
    handleCategoryChange,
    navigate,
    isEditing,
    productId
  };
};
