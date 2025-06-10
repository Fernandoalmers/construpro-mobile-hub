
import React from 'react';
import { Package } from 'lucide-react';

interface ProductImageDisplayProps {
  imageUrl?: string | null;
  productName: string;
  className?: string;
}

const ProductImageDisplay: React.FC<ProductImageDisplayProps> = ({ 
  imageUrl, 
  productName, 
  className = "w-16 h-16" 
}) => {
  if (!imageUrl) {
    return (
      <div className={`${className} bg-gray-100 rounded-md flex items-center justify-center`}>
        <Package size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      className={`${className} object-cover rounded-md`}
      onError={(e) => {
        console.log(`[ProductImageDisplay] Image load error for "${productName}":`, imageUrl);
        // Fallback para caso a imagem falhe ao carregar
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = target.parentElement?.querySelector('.fallback-icon');
        if (fallback) {
          (fallback as HTMLElement).style.display = 'flex';
        }
      }}
    />
  );
};

export default ProductImageDisplay;
