
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
      
      // Process images first
      const processedImages = processImages(initialData.imagens);
      console.log('[useProductFormState] Processed images result:', processedImages);
      
      // Initialize form data and image states
      initializeFormData(initialData, processedImages);
      initializeImageStates(processedImages);
    }
  }, [initialData, processImages, initializeFormData, initializeImageStates]);

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
