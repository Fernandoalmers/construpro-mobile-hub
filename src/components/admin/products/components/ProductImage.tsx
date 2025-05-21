
import React from 'react';

interface ProductImageProps {
  imagemUrl: string | null | undefined;
  productName: string;
  size?: 'sm' | 'lg';
}

const ProductImage: React.FC<ProductImageProps> = ({ imagemUrl, productName, size = 'sm' }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Log debug info 
  React.useEffect(() => {
    if (!imagemUrl) {
      console.log(`[ProductImage] No image URL for product: ${productName}`);
    }
  }, [imagemUrl, productName]);
  
  const sizeClasses = {
    sm: "w-10 h-10",
    lg: "w-full aspect-square"
  };
  
  if (!imagemUrl || imageError) {
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
      src={imagemUrl} 
      alt={productName}
      className={`${sizeClasses[size]} object-cover rounded`}
      onError={() => {
        console.log(`[ProductImage] Error loading image for: ${productName}, URL: ${imagemUrl}`);
        setImageError(true);
      }}
    />
  );
};

export default ProductImage;
