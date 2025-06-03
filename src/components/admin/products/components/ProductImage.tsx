
import React from 'react';
import { Package } from 'lucide-react';
import { safeFirstImage, handleImageError } from '@/utils/imageUtils';

interface ProductImageProps {
  imagemUrl?: string | null;
  imagens?: string[] | any[] | string | null;
  productName: string;
  size?: 'sm' | 'lg' | 'xl';
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({
  imagemUrl,
  imagens,
  productName,
  size = 'lg',
  className = ''
}) => {
  // Use utility function to safely extract image URL
  const getImageUrl = (): string | null => {
    // Priority 1: Use imagemUrl if available and valid
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
      return imagemUrl;
    }

    // Priority 2: Extract from imagens using safe utility
    return safeFirstImage(imagens);
  };

  const imageUrl = getImageUrl();
  
  // Size classes
  const sizeClasses = {
    sm: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 16,
    lg: 24,
    xl: 32
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-200 flex items-center justify-center ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-contain"
          onError={handleImageError}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Package size={iconSizes[size]} />
          <span className="text-xs mt-1">Sem imagem</span>
        </div>
      )}
    </div>
  );
};

export default ProductImage;
