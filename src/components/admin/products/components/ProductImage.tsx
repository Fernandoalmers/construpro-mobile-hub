
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
  showDiagnostics = true, // Ativado por padrão temporariamente
  onImageError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [urlStatus, setUrlStatus] = useState<'testing' | 'valid' | 'invalid' | 'timeout'>('testing');
  const [loadTime, setLoadTime] = useState<number>(0);
  
  // Enhanced image URL extraction with detailed logging
  const getImageUrl = (): string | null => {
    console.group(`[ProductImage] Processing "${productName}"`);
    console.log('Raw imagemUrl:', imagemUrl);
    console.log('Raw imagens:', imagens);
    
    // Priority 1: Use imagemUrl if available and valid
    if (imagemUrl && typeof imagemUrl === 'string' && imagemUrl.trim() !== '') {
      console.log('✅ Using imagemUrl:', imagemUrl);
      console.groupEnd();
      return imagemUrl;
    }

    // Priority 2: Parse imagens using enhanced parser
    const parseResult = parseImageData(imagens);
    
    console.log('Parse result:', {
      urls: parseResult.urls,
      errors: parseResult.errors,
      originalFormat: parseResult.originalFormat,
      isValid: parseResult.isValid
    });
    
    if (parseResult.urls.length > 0) {
      console.log('✅ Using parsed URL:', parseResult.urls[0]);
      console.groupEnd();
      return parseResult.urls[0];
    }
    
    console.log('❌ No valid URL found');
    console.groupEnd();
    return null;
  };

  const imageUrl = getImageUrl();
  
  // Test URL connectivity with timeout
  const testUrlConnectivity = async (url: string): Promise<void> => {
    if (!url) return;
    
    setUrlStatus('testing');
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      console.log(`[ProductImage] Testing URL connectivity: ${url}`);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache' // Force fresh request
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      setLoadTime(responseTime);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          console.log(`✅ URL is valid and accessible (${responseTime}ms):`, url);
          setUrlStatus('valid');
        } else {
          console.warn(`⚠️ URL accessible but not an image (${contentType}):`, url);
          setUrlStatus('invalid');
        }
      } else {
        console.error(`❌ URL returned HTTP ${response.status}:`, url);
        setUrlStatus('invalid');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setLoadTime(responseTime);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ URL test timed out (${responseTime}ms):`, url);
        setUrlStatus('timeout');
      } else {
        console.error(`❌ URL test failed (${responseTime}ms):`, url, error);
        setUrlStatus('invalid');
      }
    }
  };

  // Test URL on mount and when URL changes
  useEffect(() => {
    if (imageUrl && showDiagnostics) {
      testUrlConnectivity(imageUrl);
    }
  }, [imageUrl, showDiagnostics]);

  // Enhanced image error handling with exponential backoff retry
  const handleImageErrorWithRetry = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.currentTarget;
    const originalSrc = target.src;
    
    console.error(`[ProductImage] Load error (attempt ${retryCount + 1}) for "${productName}":`, {
      originalSrc,
      imageUrl,
      imagemUrl,
      imagens,
      errorType: 'load_failed',
      urlStatus
    });
    
    setImageError(true);
    setIsLoading(false);
    
    // Notify parent component if callback provided
    if (onImageError) {
      onImageError(`Failed to load image after ${retryCount + 1} attempts: ${originalSrc}`);
    }
    
    // Auto-retry with exponential backoff (max 2 retries)
    if (retryCount < 2) {
      const backoffDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s
      console.log(`[ProductImage] Retrying in ${backoffDelay}ms...`);
      
      setTimeout(() => {
        console.log(`[ProductImage] Retry attempt ${retryCount + 1} for "${productName}"`);
        setRetryCount(prev => prev + 1);
        setImageError(false);
        setIsLoading(true);
        target.src = originalSrc + `?retry=${retryCount + 1}&t=${Date.now()}`;
      }, backoffDelay);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    console.log(`[ProductImage] ✅ Image loaded successfully for "${productName}":`, imageUrl);
  };

  // Manual retry function
  const retryImage = () => {
    console.log(`[ProductImage] Manual retry initiated for "${productName}"`);
    setImageError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Re-test URL connectivity
    if (imageUrl) {
      testUrlConnectivity(imageUrl);
    }
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

  // Enhanced diagnostic status indicator
  const getDiagnosticStatus = () => {
    if (!imageUrl) return { color: 'bg-gray-500', icon: '?' };
    if (urlStatus === 'testing') return { color: 'bg-blue-500', icon: '...' };
    if (urlStatus === 'valid' && !imageError) return { color: 'bg-green-500', icon: '✓' };
    if (urlStatus === 'timeout') return { color: 'bg-yellow-500', icon: '⏰' };
    if (urlStatus === 'invalid' || imageError) return { color: 'bg-red-500', icon: '!' };
    return { color: 'bg-gray-500', icon: '?' };
  };

  const diagnosticStatus = getDiagnosticStatus();

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-200 flex items-center justify-center relative ${className}`}>
      {imageUrl && !imageError ? (
        <>
          <img 
            src={imageUrl + (retryCount > 0 ? `?retry=${retryCount}&t=${Date.now()}` : '')}
            alt={productName}
            className="w-full h-full object-cover"
            onError={handleImageErrorWithRetry}
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
              <span className="text-xs mt-1 text-center">
                {urlStatus === 'timeout' ? 'Timeout' : 'Erro na imagem'}
              </span>
              {showDiagnostics && (
                <button
                  onClick={retryImage}
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 text-xs hover:bg-blue-600 transition-colors"
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
      
      {/* Enhanced diagnostic overlay with detailed status */}
      {showDiagnostics && (
        <div className="absolute top-0 right-0 flex flex-col gap-1">
          <div 
            className={`${diagnosticStatus.color} text-white text-xs px-1 rounded-bl flex items-center`}
            title={`Status: ${urlStatus}, Load time: ${loadTime}ms, Retries: ${retryCount}`}
          >
            {diagnosticStatus.icon}
          </div>
          {urlStatus === 'testing' && (
            <div className="bg-blue-500 text-white text-xs px-1 rounded-bl">
              <RefreshCw size={8} className="animate-spin" />
            </div>
          )}
          {urlStatus === 'valid' && (
            <div className="bg-green-100 text-green-600 text-xs px-1 rounded-bl" title={`${loadTime}ms`}>
              <Wifi size={8} />
            </div>
          )}
          {(urlStatus === 'invalid' || urlStatus === 'timeout') && (
            <div className="bg-red-100 text-red-600 text-xs px-1 rounded-bl" title={`Error: ${urlStatus}`}>
              <WifiOff size={8} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImage;
