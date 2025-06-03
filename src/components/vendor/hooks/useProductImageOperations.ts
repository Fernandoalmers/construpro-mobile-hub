
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

interface UseProductImageOperationsProps {
  imagePreviews: string[];
  setImagePreviews: (previews: string[]) => void;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  existingImages: string[];
  setExistingImages: (images: string[]) => void;
  formData: any;
  setFormData: (data: any) => void;
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

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('[useProductImageOperations] Uploading files:', files.length);

    const totalImages = imagePreviews.length + files.length;
    if (totalImages > 5) {
      toast.error(`Máximo de 5 imagens permitidas. Você pode adicionar apenas ${5 - imagePreviews.length} imagem(ns) a mais.`);
      return;
    }

    setUploadingImages(true);
    
    try {
      const newImageFiles = [...imageFiles, ...files];
      const newPreviews = [...imagePreviews];
      
      for (const file of files) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        console.log('[useProductImageOperations] Created preview URL:', previewUrl);
      }
      
      setImageFiles(newImageFiles);
      setImagePreviews(newPreviews);
      
      console.log('[useProductImageOperations] Updated states:', {
        imageFiles: newImageFiles.length,
        imagePreviews: newPreviews.length
      });
      
      toast.success(`${files.length} imagem(ns) adicionada(s). Salve o produto para fazer upload permanente.`);
    } catch (error) {
      console.error('[useProductImageOperations] Error handling image upload:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setUploadingImages(false);
    }
  }, [imagePreviews, imageFiles, setImageFiles, setImagePreviews, setUploadingImages]);

  const removeImage = useCallback((index: number) => {
    console.log('[useProductImageOperations] Removing image at index:', index);
    
    if (index < 0 || index >= imagePreviews.length) {
      console.error('[useProductImageOperations] Invalid index:', index);
      return;
    }
    
    const imageToRemove = imagePreviews[index];
    const isExistingImage = existingImages.includes(imageToRemove);
    const isBlobUrl = imageToRemove?.startsWith('blob:');
    
    console.log('[useProductImageOperations] Image removal details:', {
      imageToRemove: imageToRemove.substring(0, 100) + '...',
      isExistingImage,
      isBlobUrl,
      index,
      existingImagesCount: existingImages.length,
      imageFilesCount: imageFiles.length
    });
    
    // Create new arrays to avoid mutation
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    const newExistingImages = [...existingImages];
    const newFormImages = [...(formData.imagens || [])];
    
    // Remove from previews
    newPreviews.splice(index, 1);
    
    if (isExistingImage) {
      // Remove from existing images
      const existingIndex = existingImages.indexOf(imageToRemove);
      if (existingIndex !== -1) {
        newExistingImages.splice(existingIndex, 1);
        console.log('[useProductImageOperations] Removed from existing images at index:', existingIndex);
      }
      
      // Remove from form images
      const formImageIndex = formData.imagens?.indexOf(imageToRemove) ?? -1;
      if (formImageIndex !== -1) {
        newFormImages.splice(formImageIndex, 1);
        console.log('[useProductImageOperations] Removed from form images at index:', formImageIndex);
      }
    } else if (isBlobUrl) {
      // For blob URLs, find the corresponding file and remove it
      // Count how many blob URLs come before this one
      let blobIndex = 0;
      for (let i = 0; i < index; i++) {
        if (imagePreviews[i].startsWith('blob:')) {
          blobIndex++;
        }
      }
      
      if (blobIndex < newFiles.length) {
        newFiles.splice(blobIndex, 1);
        console.log('[useProductImageOperations] Removed file at blob index:', blobIndex);
      }
      
      // Revoke the blob URL to prevent memory leaks
      URL.revokeObjectURL(imageToRemove);
      console.log('[useProductImageOperations] Revoked blob URL');
    }
    
    // Update all states
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    setExistingImages(newExistingImages);
    setFormData((prev: any) => ({
      ...prev,
      imagens: newFormImages
    }));
    
    console.log('[useProductImageOperations] Updated states after removal:', {
      previews: newPreviews.length,
      files: newFiles.length,
      existing: newExistingImages.length,
      formImages: newFormImages.length
    });
  }, [imagePreviews, imageFiles, existingImages, formData.imagens, setImagePreviews, setImageFiles, setExistingImages, setFormData]);

  return {
    handleImageUpload,
    removeImage
  };
};
