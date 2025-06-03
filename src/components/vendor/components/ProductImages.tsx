
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
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Imagens</h2>
      <p className="text-sm text-gray-600 mb-4">
        Adicione até 5 imagens do produto (primeira será a principal) *
      </p>
      
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
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error(`Error loading preview image ${index}:`, imageUrl);
                      e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Erro';
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
        <p className="text-red-500 text-sm mt-2">É obrigatório adicionar pelo menos uma imagem.</p>
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
