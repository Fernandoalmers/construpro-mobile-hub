
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct, updateProductImages } from '@/services/vendorProductsService';
// Import direto da função específica do vendor
import { uploadProductImage } from '@/services/vendor/products/productImages';
import { ProductFormData } from './useProductFormData';

interface UseProductSaveProps {
  isEditing: boolean;
  setLoading: (loading: boolean) => void;
  existingImages: string[];
  imageFiles: File[];
  imagePreviews: string[];
  setImageFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  setExistingImages: (images: string[] | ((prev: string[]) => string[])) => void;
  setImagePreviews: (previews: string[] | ((prev: string[]) => string[])) => void;
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

      // Validation for promotion
      if (formData.promocaoAtiva) {
        if (!formData.precoPromocional || formData.precoPromocional >= formData.preco) {
          toast.error('O preço promocional deve ser menor que o preço normal');
          return;
        }
        if (!formData.promocaoInicio || !formData.promocaoFim) {
          toast.error('Defina as datas de início e fim da promoção');
          return;
        }
        if (new Date(formData.promocaoInicio) >= new Date(formData.promocaoFim)) {
          toast.error('A data de fim deve ser posterior à data de início');
          return;
        }
        if (new Date(formData.promocaoInicio) <= new Date()) {
          toast.error('A data de início deve ser futura');
          return;
        }
      }

      // Prepare product data with existing images and proper field mapping
      const productData = {
        ...formData,
        preco_normal: formData.preco,
        preco_promocional: formData.promocaoAtiva ? formData.precoPromocional : null,
        promocao_ativa: formData.promocaoAtiva,
        promocao_inicio: formData.promocaoAtiva ? formData.promocaoInicio : null,
        promocao_fim: formData.promocaoAtiva ? formData.promocaoFim : null,
        pontos_consumidor: formData.pontosConsumidor,
        pontos_profissional: formData.pontosProfissional,
        imagens: [...existingImages] // Start with existing images
      };

      console.log('[useProductSave] Initial product data:', productData);

      // Save the product first - função detecta automaticamente se é update pelo id
      const savedProduct = await saveVendorProduct(productData);
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
          // Upload images one by one to avoid conflicts
          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const imageIndex = existingImages.length + i;
            console.log(`[useProductSave] Uploading image ${i + 1}/${imageFiles.length}`);
            
            const uploadedUrl = await uploadProductImage(String(savedProduct.id), file, imageIndex);
            if (uploadedUrl) {
              uploadedImageUrls.push(uploadedUrl);
              console.log(`[useProductSave] Uploaded image ${i + 1}: ${uploadedUrl}`);
            } else {
              console.warn(`[useProductSave] Failed to upload image ${i + 1}`);
            }
          }
          
          console.log('[useProductSave] All uploaded image URLs:', uploadedImageUrls);
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
      
      const successMessage = formData.promocaoAtiva 
        ? 'Produto salvo com promoção ativa!' 
        : (isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
      toast.success(successMessage);
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
