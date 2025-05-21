
import React from 'react';

interface ProductImageProps {
  imagemUrl: string | null | undefined;
  productName: string;
  size?: 'sm' | 'lg';
  imagens?: Array<string | {url?: string, path?: string, src?: string}> | null; // Add support for imagens array
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  imagemUrl, 
  productName, 
  size = 'sm',
  imagens
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Extract image URL from either direct URL or images array
  const getImageUrl = React.useMemo(() => {
    // Debug log the image data we received
    console.log(`[ProductImage] Resolving image for ${productName}:`, {
      hasImageUrl: !!imagemUrl, 
      hasImagens: !!imagens,
      imagensLength: imagens && Array.isArray(imagens) ? imagens.length : 0,
      imagensType: imagens && Array.isArray(imagens) && imagens.length > 0 ? 
        typeof imagens[0] : 'none'
    });
    
    // First priority: direct imagemUrl if available
    if (imagemUrl) {
      return imagemUrl;
    }
    
    // Second priority: extract from imagens array if available
    if (imagens) {
      // Handle case where imagens is a string directly
      if (typeof imagens === 'string') {
        return imagens;
      }
      
      // Handle array of images
      if (Array.isArray(imagens) && imagens.length > 0) {
        const firstImage = imagens[0];
        
        // Handle different image formats
        if (typeof firstImage === 'string') {
          return firstImage;
        }
        
        if (typeof firstImage === 'object' && firstImage !== null) {
          return firstImage.url || firstImage.path || firstImage.src || null;
        }
      }
    }
    
    return null;
  }, [imagemUrl, imagens, productName]);
  
  // Log debug info 
  React.useEffect(() => {
    if (!getImageUrl) {
      console.log(`[ProductImage] No image URL resolved for product: ${productName}`, {
        hasDirectUrl: !!imagemUrl,
        hasImagens: !!imagens,
        imagensType: imagens && Array.isArray(imagens) && imagens.length > 0 ? 
          typeof imagens[0] : 'none'
      });
    } else {
      console.log(`[ProductImage] Successfully resolved image URL for ${productName}: ${getImageUrl.substring(0, 50)}...`);
    }
  }, [getImageUrl, imagemUrl, imagens, productName]);
  
  const sizeClasses = {
    sm: "w-10 h-10",
    lg: "w-full aspect-square"
  };
  
  if (!getImageUrl || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center text-gray-400`}
        title={`Imagem não disponível para: ${productName}`}
      >
        <span className="text-xs">Imagem</span>
      </div>
    );
  }
  
  return (
    <img 
      src={getImageUrl} 
      alt={productName}
      className={`${sizeClasses[size]} object-cover rounded`}
      onError={() => {
        console.log(`[ProductImage] Error loading image for: ${productName}, URL: ${getImageUrl}`);
        setImageError(true);
      }}
    />
  );
};

export default ProductImage;
