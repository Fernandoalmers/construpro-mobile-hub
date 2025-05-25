
import React from 'react';

interface ProductImageProps {
  imagemUrl: string | null | undefined;
  productName: string;
  size?: 'sm' | 'lg';
  imagens?: Array<string | {url?: string, path?: string, src?: string}> | null | string;
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
    console.log(`[ProductImage] Processing image for ${productName}:`, {
      hasImageUrl: !!imagemUrl, 
      hasImagens: !!imagens,
      imagensType: typeof imagens,
      imagensLength: Array.isArray(imagens) ? imagens.length : 'not array'
    });
    
    // First priority: direct imagemUrl if available
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
      console.log(`[ProductImage] Using direct imagemUrl for ${productName}: ${imagemUrl.substring(0, 50)}...`);
      return imagemUrl;
    }
    
    // Second priority: extract from imagens
    if (imagens) {
      // Handle case where imagens is a string directly
      if (typeof imagens === 'string' && imagens.trim() !== '') {
        console.log(`[ProductImage] Using string imagens for ${productName}: ${imagens.substring(0, 50)}...`);
        return imagens;
      }
      
      // Handle array of images
      if (Array.isArray(imagens) && imagens.length > 0) {
        const firstImage = imagens[0];
        
        // Handle different image formats
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
          console.log(`[ProductImage] Using first array image for ${productName}: ${firstImage.substring(0, 50)}...`);
          return firstImage;
        }
        
        if (typeof firstImage === 'object' && firstImage !== null) {
          const imageUrl = firstImage.url || firstImage.path || firstImage.src;
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            console.log(`[ProductImage] Using object URL for ${productName}: ${imageUrl.substring(0, 50)}...`);
            return imageUrl;
          }
        }
      }
    }
    
    console.log(`[ProductImage] No valid image URL found for ${productName}`);
    return null;
  }, [imagemUrl, imagens, productName]);
  
  const sizeClasses = {
    sm: "w-10 h-10",
    lg: "w-full aspect-square"
  };
  
  const handleImageError = () => {
    console.log(`[ProductImage] Error loading image for ${productName}, URL: ${getImageUrl}`);
    setImageError(true);
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
      onError={handleImageError}
      onLoad={() => {
        console.log(`[ProductImage] Successfully loaded image for ${productName}`);
      }}
    />
  );
};

export default ProductImage;
