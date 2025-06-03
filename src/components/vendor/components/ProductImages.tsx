
import React from 'react';
import { Upload, X } from 'lucide-react';
import { safeFirstImage, handleImageError } from '@/utils/imageUtils';

interface ProductImagesProps {
  imagePreviews: string[];
  existingImages: string[];
  imageFiles: File[];
  uploadingImages: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ProductImages: React.FC<ProductImagesProps> = ({
  imagePreviews,
  existingImages,
  imageFiles,
  uploadingImages,
  onImageUpload,
  onRemoveImage
}) => {
  console.log('[ProductImages] Render state:', {
    imagePreviews: imagePreviews.length,
    imagePreviewsUrls: imagePreviews,
    existingImages: existingImages.length,
    imageFiles: imageFiles.length,
    uploadingImages
  });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Imagens</h2>
      <p className="text-sm text-gray-600 mb-4">
        Adicione até 5 imagens do produto (primeira será a principal) *
      </p>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug Info:</strong> 
          <br />- Image previews: {imagePreviews.length} 
          <br />- Existing images: {existingImages.length} 
          <br />- New files: {imageFiles.length}
          <br />- Uploading: {uploadingImages ? 'Yes' : 'No'}
          {imagePreviews.length > 0 && (
            <div className="mt-2">
              <strong>URLs:</strong>
              {imagePreviews.map((url, i) => (
                <div key={i} className="truncate text-xs mt-1">
                  {i + 1}. {url.length > 80 ? url.substring(0, 80) + '...' : url}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Image Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
          id="image-upload"
          disabled={uploadingImages || imagePreviews.length >= 5}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer ${uploadingImages || imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {uploadingImages ? 'Processando imagens...' : 
             imagePreviews.length >= 5 ? 'Máximo de 5 imagens atingido' :
             'Clique para adicionar imagens ou arraste aqui'}
          </p>
        </label>
      </div>

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">
            Imagens ({imagePreviews.length}/5)
            {existingImages.length > 0 && ` - ${existingImages.length} existente(s)`}
            {imageFiles.length > 0 && ` - ${imageFiles.length} nova(s)`}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {imagePreviews.map((imageUrl, index) => {
              const isExisting = existingImages.includes(imageUrl);
              const isBlob = imageUrl.startsWith('blob:');
              
              return (
                <div key={`image-${index}-${Date.now()}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                    onLoad={() => console.log(`[ProductImages] Image ${index} loaded successfully:`, imageUrl.substring(0, 50) + '...')}
                    onError={handleImageError}
                  />
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                      Principal
                    </div>
                  )}
                  {isExisting && (
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                      Existente
                    </div>
                  )}
                  {isBlob && (
                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                      Nova
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {imagePreviews.length === 0 && (
        <div className="mt-4">
          <p className="text-red-500 text-sm">É obrigatório adicionar pelo menos uma imagem.</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-gray-500 text-xs mt-2 bg-gray-50 p-2 rounded">
              <p><strong>Debug:</strong> Se você está editando um produto e não vê imagens:</p>
              <p>- Existing images: {existingImages.length}</p>
              <p>- Image previews: {imagePreviews.length}</p>
              <p>- Image files: {imageFiles.length}</p>
              <p>- Verifique se as imagens estão sendo processadas corretamente no console</p>
            </div>
          )}
        </div>
      )}
      
      {imageFiles.length > 0 && (
        <p className="text-blue-600 text-sm mt-2">
          {imageFiles.length} nova(s) imagem(ns) será(ão) enviada(s) quando você salvar o produto.
        </p>
      )}
    </div>
  );
};

export default ProductImages;
