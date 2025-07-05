
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

  // Função para validar e limpar dados antes do salvamento
  const validateAndCleanData = (formData: ProductFormData) => {
    console.log('[useProductSave] Validating form data:', formData);
    
    // Validar campos obrigatórios
    if (!formData.nome || formData.nome.trim() === '') {
      throw new Error('Nome do produto é obrigatório');
    }
    
    if (!formData.descricao || formData.descricao.trim() === '') {
      throw new Error('Descrição do produto é obrigatória');
    }
    
    if (!formData.categoria || formData.categoria.trim() === '') {
      throw new Error('Categoria do produto é obrigatória');
    }
    
    if (!formData.segmento || formData.segmento.trim() === '') {
      throw new Error('Segmento do produto é obrigatório');
    }
    
    if (!formData.preco || formData.preco <= 0) {
      throw new Error('Preço deve ser maior que zero');
    }
    
    // Validar unidade de medida
    const validUnits = ['unidade', 'm2', 'litro', 'kg', 'caixa', 'pacote', 'barra', 'saco', 'rolo'];
    const unidadeMedida = formData.unidadeMedida || 'unidade';
    
    if (!validUnits.includes(unidadeMedida)) {
      console.warn('[useProductSave] Invalid unit, defaulting to "unidade":', unidadeMedida);
    }
    
    // Validar estoque
    const estoque = Math.max(0, Number(formData.estoque) || 0);
    
    console.log('[useProductSave] Validation passed, cleaned data ready');
    
    return {
      ...formData,
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim(),
      categoria: formData.categoria.trim(),
      segmento: formData.segmento.trim(),
      unidadeMedida: validUnits.includes(unidadeMedida) ? unidadeMedida : 'unidade',
      estoque
    };
  };

  const handleSave = async (formData: ProductFormData) => {
    try {
      setLoading(true);
      console.log('[useProductSave] Starting save process:', { isEditing, formData });

      // Validar e limpar dados
      const cleanedData = validateAndCleanData(formData);
      console.log('[useProductSave] Cleaned data:', cleanedData);

      // Improved promotion validation - more flexible for editing
      if (cleanedData.promocaoAtiva) {
        if (!cleanedData.precoPromocional || cleanedData.precoPromocional <= 0) {
          toast.error('O preço promocional deve ser maior que zero');
          return;
        }
        
        if (cleanedData.precoPromocional >= cleanedData.preco) {
          toast.error('O preço promocional deve ser menor que o preço normal');
          return;
        }
        
        if (!cleanedData.promocaoInicio || !cleanedData.promocaoFim) {
          toast.error('Defina as datas de início e fim da promoção');
          return;
        }
        
        const startDate = new Date(cleanedData.promocaoInicio);
        const endDate = new Date(cleanedData.promocaoFim);
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
        id: cleanedData.id, // Important: include ID for updates
        nome: cleanedData.nome,
        descricao: cleanedData.descricao,
        categoria: cleanedData.categoria,
        segmento: cleanedData.segmento,
        preco_normal: cleanedData.preco, // Map preco -> preco_normal
        preco_promocional: cleanedData.promocaoAtiva ? cleanedData.precoPromocional : null,
        promocao_ativa: cleanedData.promocaoAtiva,
        promocao_inicio: cleanedData.promocaoAtiva && cleanedData.promocaoInicio ? cleanedData.promocaoInicio : null,
        promocao_fim: cleanedData.promocaoAtiva && cleanedData.promocaoFim ? cleanedData.promocaoFim : null,
        pontos_consumidor: cleanedData.pontosConsumidor || 0, // Map pontosConsumidor -> pontos_consumidor
        pontos_profissional: cleanedData.pontosProfissional || 0, // Map pontosProfissional -> pontos_profissional
        sku: cleanedData.sku?.trim() || null,
        codigo_barras: cleanedData.codigoBarras?.trim() || null, // Map codigoBarras -> codigo_barras
        estoque: cleanedData.estoque,
        unidade_medida: cleanedData.unidadeMedida, // Map unidadeMedida -> unidade_medida
        valor_conversao: cleanedData.valorConversao,
        controle_quantidade: cleanedData.controleQuantidade || 'livre',
        imagens: [...existingImages], // Start with existing images
        // Ensure we have a valid segmento_id if available
        segmento_id: cleanedData.segmentoId || null
      };

      console.log('[useProductSave] Final product data for save:', productData);

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
      
      const successMessage = cleanedData.promocaoAtiva 
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
        } else if (supabaseError.code) {
          // Handle specific database error codes
          switch (supabaseError.code) {
            case '23505':
              errorMessage = 'SKU ou código de barras já existe. Use valores únicos.';
              break;
            case '23503':
              errorMessage = 'Categoria ou segmento inválido. Verifique os dados.';
              break;
            case '23514':
              errorMessage = 'Dados inválidos. Verifique preços e quantidades.';
              break;
            default:
              errorMessage = `Erro no banco de dados (${supabaseError.code})`;
          }
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
