
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct } from '@/services/vendor/products/productOperations';
import { uploadProductImage } from '@/services/products/images/imageUpload';

interface UseProductSaveProps {
  isEditing: boolean;
  setLoading: (loading: boolean) => void;
  existingImages: string[];
  imageFiles: File[];
  imagePreviews: string[];
  setImageFiles: (files: File[]) => void;
  setExistingImages: (images: string[]) => void;
  setImagePreviews: (previews: string[]) => void;
  setFormData: (data: any) => void;
  navigate: (path: string) => void;
}

export const useProductSave = ({
  isEditing,
  setLoading,
  existingImages,
  imageFiles,
  imagePreviews,
  setImageFiles,
  setExistingImages,
  setImagePreviews,
  setFormData,
  navigate
}: UseProductSaveProps) => {

  const handleSave = useCallback(async (formData: any) => {
    setLoading(true);
    
    try {
      let productToSave = {
        ...formData,
        imagens: [...existingImages]
      };
      
      const savedProduct = await saveVendorProduct(productToSave);
      
      if (!savedProduct) {
        throw new Error('Falha ao salvar produto');
      }
      
      let finalImages = [...existingImages];
      
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          try {
            const uploadedUrl = await uploadProductImage(savedProduct.id, file, finalImages.length + i);
            
            if (uploadedUrl) {
              finalImages.push(uploadedUrl);
            }
          } catch (uploadError) {
            console.error('[useProductSave] Error uploading image:', file.name, uploadError);
          }
        }
        
        if (finalImages.length > existingImages.length) {
          const updatedProduct = await saveVendorProduct({
            ...productToSave,
            id: savedProduct.id,
            imagens: finalImages
          });
          
          if (updatedProduct) {
            console.log('[useProductSave] Product updated with new images successfully');
          }
        }
      }
      
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
      imagePreviews.forEach((preview) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      
      setImageFiles([]);
      setExistingImages(finalImages);
      setImagePreviews(finalImages);
      setFormData((prev: any) => ({
        ...prev,
        id: savedProduct.id,
        imagens: finalImages
      }));
      
      setTimeout(() => {
        navigate('/vendor/products');
      }, 1500);
      
    } catch (error) {
      console.error('[useProductSave] Error saving product:', error);
      toast.error('Erro ao salvar produto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [isEditing, setLoading, existingImages, imageFiles, imagePreviews, setImageFiles, setExistingImages, setImagePreviews, setFormData, navigate]);

  return {
    handleSave
  };
};
