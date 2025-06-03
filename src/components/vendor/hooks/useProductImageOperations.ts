
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
    
    const imageToRemove = imagePreviews[index];
    const isExistingImage = existingImages.includes(imageToRemove);
    const isBlobUrl = imageToRemove?.startsWith('blob:');
    
    console.log('[useProductImageOperations] Image removal details:', {
      imageToRemove,
      isExistingImage,
      isBlobUrl,
      index
    });
    
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
      }
      
      // Remove from form images
      const formImageIndex = formData.imagens.indexOf(imageToRemove);
      if (formImageIndex !== -1) {
        newFormImages.splice(formImageIndex, 1);
      }
    } else if (isBlobUrl) {
      // For blob URLs, find the corresponding file and remove it
      const blobUrls = imagePreviews.filter(img => img.startsWith('blob:'));
      const blobIndex = blobUrls.indexOf(imageToRemove);
      
      if (blobIndex !== -1 && blobIndex < newFiles.length) {
        newFiles.splice(blobIndex, 1);
      }
      
      // Revoke the blob URL to prevent memory leaks
      URL.revokeObjectURL(imageToRemove);
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
