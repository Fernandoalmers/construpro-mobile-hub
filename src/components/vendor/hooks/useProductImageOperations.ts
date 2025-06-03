
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { ProductFormData } from './useProductFormData';

interface UseProductImageOperationsProps {
  imagePreviews: string[];
  setImagePreviews: (previews: string[]) => void;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  existingImages: string[];
  setExistingImages: (images: string[]) => void;
  formData: ProductFormData;
  setFormData: (updater: (prev: ProductFormData) => ProductFormData) => void;
  setUploadingImages: (uploading: boolean) => void;
}

export const useProductImageOperations = ({
  imagePreviews,
  setImagePreviews,
  imageFiles,
  setImageFiles,
  existingImages,
  setExistingImages,
  formData,
  setFormData,
  setUploadingImages
}: UseProductImageOperationsProps) => {

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const totalImages = imagePreviews.length + files.length;
    if (totalImages > 5) {
      toast.error('Máximo de 5 imagens permitidas');
      return;
    }

    console.log('[useProductImageOperations] Adding', files.length, 'new images');
    setUploadingImages(true);

    const newFiles = Array.from(files);
    const newPreviews: string[] = [];

    // Create blob URLs for preview
    newFiles.forEach(file => {
      const blobUrl = URL.createObjectURL(file);
      newPreviews.push(blobUrl);
    });

    // Update states
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      imagens: [...prev.imagens, ...newPreviews]
    }));

    console.log('[useProductImageOperations] Images added successfully');
    setUploadingImages(false);
  }, [imagePreviews, setImageFiles, setImagePreviews, setFormData, setUploadingImages]);

  const removeImage = useCallback((index: number) => {
    console.log('[useProductImageOperations] Removing image at index:', index);
    
    const imageToRemove = imagePreviews[index];
    const isExistingImage = existingImages.includes(imageToRemove);
    const isBlobUrl = imageToRemove?.startsWith('blob:');

    if (isBlobUrl) {
      // Revoke blob URL to free memory
      URL.revokeObjectURL(imageToRemove);
      
      // Find and remove from imageFiles
      const fileIndex = imagePreviews.slice(0, index + 1).filter(url => url.startsWith('blob:')).length - 1;
      if (fileIndex >= 0) {
        setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    } else if (isExistingImage) {
      // Remove from existing images
      setExistingImages(prev => prev.filter(url => url !== imageToRemove));
    }

    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));

    console.log('[useProductImageOperations] Image removed successfully');
  }, [imagePreviews, existingImages, setImageFiles, setImagePreviews, setExistingImages, setFormData]);

  return {
    handleImageUpload,
    removeImage
  };
};
