
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

      // Improved promotion validation - more flexible for editing
      if (formData.promocaoAtiva) {
        if (!formData.precoPromocional || formData.precoPromocional <= 0) {
          toast.error('O preço promocional deve ser maior que zero');
          return;
        }
        
        if (formData.precoPromocional >= formData.preco) {
          toast.error('O preço promocional deve ser menor que o preço normal');
          return;
        }
        
        if (!formData.promocaoInicio || !formData.promocaoFim) {
          toast.error('Defina as datas de início e fim da promoção');
          return;
        }
        
        const startDate = new Date(formData.promocaoInicio);
        const endDate = new Date(formData.promocaoFim);
        const now = new Date();
        
        if (startDate >= endDate) {
          toast.error('A data de fim deve ser posterior à data de início');
          return;
        }
        
        // Allow editing of active promotions - only check if it's a new promotion
        if (!isEditing && startDate <= now) {
          toast.error('A data de início deve ser futura para novas promoções');
          return;
        }
        
        // For editing, just ensure the promotion hasn't already ended
        if (isEditing && endDate <= now) {
          toast.error('Não é possível editar uma promoção que já terminou');
          return;
        }
      }

      // Prepare product data with correct field mapping (frontend camelCase -> backend snake_case)
      const productData = {
        id: formData.id, // Important: include ID for updates
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: formData.categoria,
        segmento: formData.segmento,
        preco_normal: formData.preco, // Map preco -> preco_normal
        preco_promocional: formData.promocaoAtiva ? formData.precoPromocional : null,
        promocao_ativa: formData.promocaoAtiva,
        promocao_inicio: formData.promocaoAtiva && formData.promocaoInicio ? formData.promocaoInicio : null,
        promocao_fim: formData.promocaoAtiva && formData.promocaoFim ? formData.promocaoFim : null,
        pontos_consumidor: formData.pontosConsumidor, // Map pontosConsumidor -> pontos_consumidor
        pontos_profissional: formData.pontosProfissional, // Map pontosProfissional -> pontos_profissional
        sku: formData.sku,
        codigo_barras: formData.codigoBarras, // Map codigoBarras -> codigo_barras
        estoque: formData.estoque,
        imagens: [...existingImages] // Start with existing images
      };

      console.log('[useProductSave] Mapped product data for save:', productData);

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

      // Update form state with saved data (map back from snake_case to camelCase)
      setFormData(prev => ({
        ...prev,
        id: savedProduct.id,
        imagens: allImageUrls,
        // Update with actual saved values to ensure consistency
        preco: savedProduct.preco_normal || prev.preco,
        precoPromocional: savedProduct.preco_promocional,
        promocaoAtiva: savedProduct.promocao_ativa || false,
        pontosConsumidor: savedProduct.pontos_consumidor || prev.pontosConsumidor,
        pontosProfissional: savedProduct.pontos_profissional || prev.pontosProfissional
      }));

      // Update image states
      setExistingImages(allImageUrls);
      setImagePreviews(allImageUrls);
      setImageFiles([]);

      console.log('[useProductSave] Save completed successfully');
      
      const successMessage = formData.promocaoAtiva 
        ? (isEditing ? 'Produto e promoção atualizados com sucesso!' : 'Produto salvo com promoção ativa!') 
        : (isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
      toast.success(successMessage);
      navigate('/vendor/products');

    } catch (error) {
      console.error('[useProductSave] Error saving product:', error);
      
      // Improved error handling with specific messages
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle Supabase errors
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.error_description) {
          errorMessage = supabaseError.error_description;
        }
      }
      
      console.error('[useProductSave] Processed error message:', errorMessage);
      toast.error('Erro ao salvar produto: ' + errorMessage);
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
