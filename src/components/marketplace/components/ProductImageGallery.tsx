
import React from 'react';

interface ProductImageGalleryProps {
  mainImage: string;
  images?: string[];
  productName: string;
  hasDiscount: boolean;
  discountPercentage?: number;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  mainImage,
  images = [],
  productName,
  hasDiscount,
  discountPercentage
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="aspect-square relative">
        <img
          src={mainImage || 'https://via.placeholder.com/400'}
          alt={productName}
          className="w-full h-full object-contain rounded-md"
        />
        {hasDiscount && discountPercentage && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold rounded-md px-2 py-1">
            {discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Image thumbnails */}
      {images && images.length > 0 && (
        <div className="flex mt-4 gap-2 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <div 
              key={index} 
              className="w-16 h-16 border border-gray-200 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:border-blue-500"
            >
              <img 
                src={url} 
                alt={`${productName} - imagem ${index + 1}`} 
                className="w-full h-full object-contain" 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
