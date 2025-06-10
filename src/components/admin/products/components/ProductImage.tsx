
import React, { useState } from 'react';
import { Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { parseImageData } from '@/utils/imageParser';

interface ProductImageProps {
  imagemUrl?: string | null;
  imagens?: string[] | any[] | string | null;
  productName: string;
  size?: 'sm' | 'lg' | 'xl';
  className?: string;
  showDiagnostics?: boolean;
  onImageError?: (error: string) => void;
}

const ProductImage: React.FC<ProductImageProps> = ({
  imagemUrl,
  imagens,
  productName,
  size = 'lg',
  className = '',
  showDiagnostics = false,
  onImageError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use enhanced parser to safely extract image URL
  const getImageUrl = (): string | null => {
    // Priority 1: Use imagemUrl if available and valid
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
      return imagemUrl;
    }

    // Priority 2: Parse imagens using enhanced parser
    const parseResult = parseImageData(imagens);
    
    if (showDiagnostics) {
      console.log(`[ProductImage] Parse result for "${productName}":`, {
        urls: parseResult.urls,
        errors: parseResult.errors,
        originalFormat: parseResult.originalFormat,
        needsCorrection: parseResult.errors.length > 0
      });
    }
    
    return parseResult.urls.length > 0 ? parseResult.urls[0] : null;
  };

  const imageUrl = getImageUrl();
  
  // Enhanced image error handling with retry
  const handleImageErrorWithDiagnostics = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.currentTarget;
    const originalSrc = target.src;
    
    console.error(`[ProductImage] Image load error for product "${productName}":`, {
      originalSrc,
      imageUrl,
      imagemUrl,
      imagens,
      retryCount,
      errorType: 'load_failed'
    });
    
    setImageError(true);
    setIsLoading(false);
    
    // Notify parent component if callback provided
    if (onImageError) {
      onImageError(`Failed to load image: ${originalSrc}`);
    }
    
    // Auto-retry once after 2 seconds
    if (retryCount < 1) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
        setIsLoading(true);
        target.src = originalSrc + '?retry=' + (retryCount + 1);
      }, 2000);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    if (showDiagnostics) {
      console.log(`[ProductImage] ✅ Image loaded successfully for product "${productName}":`, imageUrl);
    }
  };

  // Manual retry function
  const retryImage = () => {
    setImageError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 20,
    lg: 24,
    xl: 32
  };

  // Enhanced diagnostic information
  if (showDiagnostics) {
    const parseResult = parseImageData(imagens);
    console.log(`[ProductImage Diagnostics] Product: "${productName}"`, {
      imageUrl,
      imagemUrl,
      imagens,
      parseResult,
      imageError,
      isLoading,
      retryCount
    });
  }

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-200 flex items-center justify-center relative ${className}`}>
      {imageUrl && !imageError ? (
        <>
          <img 
            src={imageUrl + (retryCount > 0 ? `?retry=${retryCount}` : '')}
            alt={productName}
            className="w-full h-full object-cover"
            onError={handleImageErrorWithDiagnostics}
            onLoad={handleImageLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <RefreshCw size={iconSizes[size] / 2} className="animate-spin text-gray-400" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400 relative">
          {imageError ? (
            <>
              <AlertTriangle size={iconSizes[size]} className="text-red-400" />
              <span className="text-xs mt-1 text-center">Erro na imagem</span>
              {showDiagnostics && (
                <button
                  onClick={retryImage}
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 text-xs hover:bg-blue-600"
                  title="Tentar novamente"
                >
                  <RefreshCw size={8} />
                </button>
              )}
            </>
          ) : (
            <>
              <Package size={iconSizes[size]} />
              <span className="text-xs mt-1">Sem imagem</span>
            </>
          )}
        </div>
      )}
      
      {/* Enhanced diagnostic overlay */}
      {showDiagnostics && (
        <div className="absolute top-0 right-0 text-white text-xs px-1 rounded-bl">
          {imageError ? (
            <div className="bg-red-500">!</div>
          ) : imageUrl ? (
            <div className="bg-green-500">✓</div>
          ) : (
            <div className="bg-yellow-500">?</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImage;
