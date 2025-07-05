
import React from 'react';
import { toast } from '@/components/ui/sonner';
import { useProductFormState } from './hooks/useProductFormState';
import { useProductImageOperations } from './hooks/useProductImageOperations';
import { useProductValidation } from './hooks/useProductValidation';
import { useProductSave } from './hooks/useProductSave';
import ProductFormHeader from './components/ProductFormHeader';
import ProductBasicInformation from './components/ProductBasicInformation';
import ProductIdentification from './components/ProductIdentification';
import ProductPricing from './components/ProductPricing';
import PromotionSection from './form-sections/PromotionSection';
import ProductImages from './components/ProductImages';
import ProductPoints from './components/ProductPoints';

interface ProductFormScreenProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

const ProductFormScreen: React.FC<ProductFormScreenProps> = ({ 
  isEditing = false, 
  productId, 
  initialData 
}) => {
  const {
    loading,
    setLoading,
    uploadingImages,
    setUploadingImages,
    currentSegmentId,
    formData,
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
    navigate
  } = useProductFormState({ isEditing, productId, initialData });

  const { handleImageUpload, removeImage } = useProductImageOperations({
    imagePreviews,
    setImagePreviews,
    imageFiles,
    setImageFiles,
    existingImages,
    setExistingImages,
    formData,
    setFormData: (updater) => {
      if (typeof updater === 'function') {
        const newData = updater(formData);
        Object.keys(newData).forEach(key => {
          if (newData[key] !== formData[key]) {
            handleInputChange(key, newData[key]);
          }
        });
      }
    },
    setUploadingImages
  });

  const { validateForm, formatBarcode, validateBarcode } = useProductValidation();

  const { handleSave } = useProductSave({
    isEditing,
    setLoading,
    existingImages,
    imageFiles,
    imagePreviews,
    setImageFiles,
    setExistingImages,
    setImagePreviews,
    setFormData: (updater) => {
      if (typeof updater === 'function') {
        const newData = updater(formData);
        Object.keys(newData).forEach(key => {
          if (newData[key] !== formData[key]) {
            handleInputChange(key, newData[key]);
          }
        });
      }
    },
    navigate
  });

  const onSave = async () => {
    console.log('[ProductFormScreen] Starting save with form data:', formData);
    
    try {
      // Enhanced validation with better error messages
      const validationError = validateForm(formData, existingImages, imageFiles);
      if (validationError) {
        console.error('[ProductFormScreen] Validation error:', validationError);
        toast.error(validationError);
        return;
      }

      // Additional promotion validation
      if (formData.promocaoAtiva) {
        if (!formData.precoPromocional || formData.precoPromocional <= 0) {
          toast.error('Preço promocional deve ser maior que zero');
          return;
        }
        
        if (formData.precoPromocional >= formData.preco) {
          toast.error('Preço promocional deve ser menor que o preço normal');
          return;
        }
        
        if (!formData.promocaoInicio || !formData.promocaoFim) {
          toast.error('Datas de promoção são obrigatórias');
          return;
        }
        
        const startDate = new Date(formData.promocaoInicio);
        const endDate = new Date(formData.promocaoFim);
        
        if (startDate >= endDate) {
          toast.error('Data de fim deve ser posterior à data de início');
          return;
        }
        
        console.log('[ProductFormScreen] Promotion validation passed');
      }

      console.log('[ProductFormScreen] Validation passed, proceeding with save');
      await handleSave(formData);
      
    } catch (error) {
      console.error('[ProductFormScreen] Error in onSave:', error);
      
      // Show specific error message
      let errorMessage = 'Erro desconhecido ao salvar produto';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      // Preserve multi-line error messages for better readability
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n');
        toast.error(lines[0], {
          description: lines.slice(1).join('\n')
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <ProductFormHeader
        isEditing={isEditing}
        onBack={() => navigate('/vendor/products')}
        onSave={onSave}
        loading={loading}
      />

      <div className="flex-1 p-6 space-y-6">
        <ProductBasicInformation
          formData={formData}
          currentSegmentId={currentSegmentId}
          onInputChange={handleInputChange}
          onSegmentNameChange={handleSegmentNameChange}
          onSegmentIdChange={handleSegmentIdChange}
          onCategoryChange={handleCategoryChange}
        />

        <ProductIdentification
          formData={formData}
          onInputChange={handleInputChange}
          formatBarcode={formatBarcode}
          validateBarcode={validateBarcode}
        />

        <ProductPricing
          formData={formData}
          onInputChange={handleInputChange}
        />

        <PromotionSection
          formData={formData}
          onInputChange={handleInputChange}
        />

        <ProductImages
          imagePreviews={imagePreviews}
          existingImages={existingImages}
          imageFiles={imageFiles}
          uploadingImages={uploadingImages}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
        />

        <ProductPoints
          formData={formData}
          onInputChange={handleInputChange}
        />
      </div>
    </div>
  );
};

export default ProductFormScreen;
