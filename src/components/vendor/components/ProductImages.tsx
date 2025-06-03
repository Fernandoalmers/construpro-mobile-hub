
import React from 'react';
import { Upload, X } from 'lucide-react';

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
  // Improved debug logging
  console.log('[ProductImages] Render state:', {
    imagePreviews: imagePreviews.length,
    imagePreviewsContent: imagePreviews,
    existingImages: existingImages.length,
    existingImagesContent: existingImages,
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
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <strong>Debug:</strong> 
          <br />- Previews: {imagePreviews.length} {imagePreviews.length > 0 && `(${imagePreviews.map(img => img.length > 50 ? img.substring(0, 50) + '...' : img).join(', ')})`}
          <br />- Existing: {existingImages.length} {existingImages.length > 0 && `(${existingImages.map(img => img.length > 50 ? img.substring(0, 50) + '...' : img).join(', ')})`}
          <br />- Files: {imageFiles.length}
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
              
              console.log(`[ProductImages] Rendering image ${index}:`, {
                url: imageUrl.substring(0, 100) + '...',
                isExisting,
                isBlob,
                fullUrl: imageUrl
              });
              
              return (
                <div key={`${index}-${imageUrl.substring(imageUrl.length - 10)}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                    onLoad={() => console.log(`[ProductImages] Image ${index} loaded successfully`)}
                    onError={(e) => {
                      console.error(`[ProductImages] Error loading image ${index}:`, imageUrl);
                      // Don't replace with placeholder for now, let user see the broken image
                      console.error('[ProductImages] Image failed to load, URL:', imageUrl);
                    }}
                  />
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="text-gray-500 text-xs mt-1">
              <p>Debug: Se você está editando um produto, verifique se as imagens estão sendo carregadas corretamente.</p>
              <p>- Existing images: {existingImages.length}</p>
              <p>- Image previews: {imagePreviews.length}</p>
              <p>- Image files: {imageFiles.length}</p>
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
