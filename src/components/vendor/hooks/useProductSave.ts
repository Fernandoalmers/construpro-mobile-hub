
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct, uploadProductImage, updateProductImages } from '@/services/vendorProductsService';
import { ProductFormData } from './useProductFormData';

interface UseProductSaveProps {
  isEditing: boolean;
  setLoading: (loading: boolean) => void;
  existingImages: string[];
  imageFiles: File[];
  imagePreviews: string[];
  setImageFiles: (files: File[]) => void;
  setExistingImages: (images: string[]) => void;
  setImagePreviews: (previews: string[]) => void;
  setFormData: (updater: (prev: ProductFormData) => ProductFormData) => void;
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
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleSave = async (formData: ProductFormData) => {
    try {
      setLoading(true);
      console.log('[useProductSave] Starting save process:', { isEditing, formData });

      // Prepare product data with existing images
      const productData = {
        ...formData,
        imagens: [...existingImages] // Start with existing images
      };

      console.log('[useProductSave] Initial product data:', productData);

      // Save the product first
      const savedProduct = await saveVendorProduct(productData, isEditing);
      console.log('[useProductSave] Product saved:', savedProduct);

      if (!savedProduct?.id) {
        throw new Error('Erro ao salvar produto: ID não retornado');
      }

      // Upload new images if any
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        console.log('[useProductSave] Uploading', imageFiles.length, 'new images');
        setUploadingImages(true);
        
        try {
          const uploadPromises = imageFiles.map((file, index) =>
            uploadProductImage(savedProduct.id, file, existingImages.length + index)
          );
          
          uploadedImageUrls = await Promise.all(uploadPromises);
          uploadedImageUrls = uploadedImageUrls.filter(url => url !== null) as string[];
          
          console.log('[useProductSave] Uploaded image URLs:', uploadedImageUrls);
        } catch (uploadError) {
          console.error('[useProductSave] Error uploading images:', uploadError);
          toast.error('Erro ao fazer upload das imagens');
          throw uploadError;
        } finally {
          setUploadingImages(false);
        }
      }

      // Combine all image URLs
      const allImageUrls = [...existingImages, ...uploadedImageUrls];
      console.log('[useProductSave] All image URLs:', allImageUrls);

      // Always update the product images field to ensure sync
      if (allImageUrls.length > 0) {
        console.log('[useProductSave] Updating product images in database');
        const updateSuccess = await updateProductImages(savedProduct.id, allImageUrls);
        if (!updateSuccess) {
          console.warn('[useProductSave] Failed to update product images field');
        }
      }

      // Update form state
      setFormData(prev => ({
        ...prev,
        id: savedProduct.id,
        imagens: allImageUrls
      }));

      // Update image states
      setExistingImages(allImageUrls);
      setImagePreviews(allImageUrls);
      setImageFiles([]);

      console.log('[useProductSave] Save completed successfully');
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      navigate('/vendor/products');

    } catch (error) {
      console.error('[useProductSave] Error saving product:', error);
      toast.error('Erro ao salvar produto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return {
    handleSave,
    uploadingImages
  };
};
