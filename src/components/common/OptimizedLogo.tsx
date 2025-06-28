
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedLogoProps {
  src: string | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
}

const OptimizedLogo: React.FC<OptimizedLogoProps> = ({
  src,
  fallbackSrc = '/lovable-uploads/7520caa6-efbb-4176-9c9f-8d37f88c7ff1.png',
  alt,
  className = '',
  onLoad,
  onError,
  showSkeleton = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Determinar qual URL usar
  useEffect(() => {
    const urlToUse = src || fallbackSrc;
    if (urlToUse !== currentSrc) {
      console.log('🖼️ [OptimizedLogo] Atualizando src:', urlToUse);
      setCurrentSrc(urlToUse);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src, fallbackSrc, currentSrc]);

  const handleLoad = () => {
    console.log('✅ [OptimizedLogo] Logo carregada:', currentSrc);
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    console.log('❌ [OptimizedLogo] Erro ao carregar logo:', currentSrc);
    setHasError(true);
    setIsLoaded(false);
    
    // Se não é o fallback, tentar usar o fallback
    if (currentSrc !== fallbackSrc) {
      console.log('🔄 [OptimizedLogo] Tentando fallback:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    onError?.();
  };

  // Mostrar skeleton enquanto carrega
  if (!isLoaded && !hasError && showSkeleton) {
    return <Skeleton className={`${className} animate-pulse`} />;
  }

  // Se erro no fallback, mostrar texto
  if (hasError && currentSrc === fallbackSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-construPro-blue text-white font-bold text-xl`}>
        Matershop
      </div>
    );
  }

  return (
    <img
      src={currentSrc || fallbackSrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={handleLoad}
      onError={handleError}
      loading="eager"
    />
  );
};

export default OptimizedLogo;
