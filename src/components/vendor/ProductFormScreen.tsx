
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
    const validationError = validateForm(formData, existingImages, imageFiles);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    await handleSave(formData);
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
