
import React from 'react';
import { Package } from 'lucide-react';

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
  // Function to safely extract image URL
  const getImageUrl = (): string | null => {
    console.log(`[ProductImage] Processing image for ${productName}:`, {
      hasImageUrl: !!imagemUrl,
      hasImagens: !!imagens,
      imagensType: typeof imagens,
      imagensLength: Array.isArray(imagens) ? imagens.length : 'not array',
      imagemUrl: imagemUrl || null
    });

    // Priority 1: Use imagemUrl if available and valid
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '' && !imagemUrl.startsWith('blob:')) {
      console.log(`[ProductImage] Using imagemUrl for ${productName}:`, imagemUrl);
      return imagemUrl;
    }

    // Priority 2: Extract from imagens array
    if (imagens) {
      let imageArray: string[] = [];
      
      // Handle string (JSON)
      if (typeof imagens === 'string') {
        try {
          const parsed = JSON.parse(imagens);
          if (Array.isArray(parsed)) {
            imageArray = parsed;
          } else if (typeof parsed === 'string' && parsed.trim() !== '') {
            imageArray = [parsed];
          }
        } catch (e) {
          // If not valid JSON, treat as single URL
          if (imagens.trim() !== '' && !imagens.startsWith('blob:')) {
            imageArray = [imagens];
          }
        }
      }
      // Handle array
      else if (Array.isArray(imagens)) {
        imageArray = imagens
          .map(img => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') {
              return img.url || img.path || img.src || '';
            }
            return '';
          })
          .filter(url => url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:'));
      }

      if (imageArray.length > 0) {
        console.log(`[ProductImage] Using first image from array for ${productName}:`, imageArray[0]);
        return imageArray[0];
      }
    }

    console.log(`[ProductImage] No valid image URL found for ${productName}`);
    return null;
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
          onError={(e) => {
            console.error(`[ProductImage] Error loading image for ${productName}:`, imageUrl);
            e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Sem+Imagem';
          }}
          onLoad={() => {
            console.log(`[ProductImage] Successfully loaded image for ${productName}`);
          }}
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
