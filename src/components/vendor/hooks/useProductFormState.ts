
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

  // Initialize form data when initialData is provided
  useEffect(() => {
    if (initialData && isEditing) {
      console.log('[useProductFormState] Initializing with data:', initialData);
      console.log('[useProductFormState] Raw images from data:', initialData.imagens);
      
      // Process images first
      const processedImages = processImages(initialData.imagens || []);
      console.log('[useProductFormState] Processed images:', processedImages);
      
      // Initialize form data with processed images
      initializeFormData(initialData, processedImages);
      
      // Initialize image states with processed images
      initializeImageStates(processedImages);
      
      console.log('[useProductFormState] Initialization complete');
    }
  }, [initialData, isEditing, processImages, initializeFormData, initializeImageStates]);

  // Debug logging
  useEffect(() => {
    console.log('[useProductFormState] Current state:', {
      formDataNome: formData.nome,
      imagePreviews: imagePreviews.length,
      existingImages: existingImages.length,
      imageFiles: imageFiles.length,
      previewUrls: imagePreviews.slice(0, 2)
    });
  }, [formData.nome, imagePreviews, existingImages, imageFiles]);

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
