
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
      console.log('[useProductFormState] useEffect triggered with initialData:', initialData);
      console.log('[useProductFormState] Raw images from initialData:', initialData.imagens);
      
      try {
        // Process images first
        const processedImages = processImages(initialData.imagens || []);
        console.log('[useProductFormState] Processed images result:', processedImages);
        
        // Initialize form data with processed images
        initializeFormData(initialData, processedImages);
        
        // Initialize image states with processed images
        console.log('[useProductFormState] About to initialize image states with:', processedImages);
        initializeImageStates(processedImages);
        
        console.log('[useProductFormState] Initialization complete');
      } catch (error) {
        console.error('[useProductFormState] Error during initialization:', error);
      }
    }
  }, [initialData, isEditing, processImages, initializeFormData, initializeImageStates]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('[useProductFormState] State debug:', {
      formDataNome: formData.nome,
      formDataDescricao: formData.descricao,
      imagePreviews: imagePreviews.length,
      existingImages: existingImages.length,
      imageFiles: imageFiles.length,
      imagePreviewsContent: imagePreviews.slice(0, 2) // Show first 2 URLs for debugging
    });
  }, [formData.nome, formData.descricao, imagePreviews, existingImages, imageFiles]);

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
