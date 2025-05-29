
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
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
      // Don't filter out blob URLs here - they might be valid temporary URLs
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
          if (imagens.trim() !== '') {
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
          .filter(url => url && typeof url === 'string' && url.trim() !== '');
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[ProductImage] Error loading image for ${productName}:`, imageUrl);
    const target = e.currentTarget;
    // Try a more generic placeholder that's more likely to work
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA0NUw5MCA2MEg2MEw3NSA0NVoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHN2ZyB4PSI2MyIgeT0iNjMiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJtMjEgMTYtNC0ydi0yaDRWOWMwLTEuMS0uOS0yLTItMkg1Yy0xLjEgMC0yIC45LTIgMnY2aDQudjJsLTQgMlMzIDE4IDMgMThjMCAuNi4yIDEgLjUgMS40TDEyIDI0bDguNS01LjZjLjMtLjQuNS0uOC41LTEuNCAwIDAgMC0uNi0xLTEuNXoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cjwvc3ZnPgo=';
  };

  const handleImageLoad = () => {
    console.log(`[ProductImage] Successfully loaded image for ${productName}`);
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-200 flex items-center justify-center ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-contain"
          onError={handleImageError}
          onLoad={handleImageLoad}
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
