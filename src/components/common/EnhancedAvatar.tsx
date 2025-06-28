
import React, { useState, useEffect } from 'react';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, RefreshCw } from 'lucide-react';

interface EnhancedAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showLoadingIndicator?: boolean;
}

const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({
  src,
  alt = "Avatar",
  fallback,
  size = 'md',
  className,
  onClick,
  showLoadingIndicator = true,
}) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  const sizeClassMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  };

  const loadingSizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  // Get initials from fallback text
  const initials = fallback 
    ? fallback.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setImageStatus(src ? 'loading' : 'error');
    }
  }, [src, currentSrc]);

  // Set timeout for loading
  useEffect(() => {
    if (imageStatus === 'loading' && currentSrc) {
      const timeout = setTimeout(() => {
        console.log('⏰ [EnhancedAvatar] Timeout na imagem:', currentSrc);
        setImageStatus('error');
      }, 5000); // Reduzido para 5 segundos

      return () => clearTimeout(timeout);
    }
  }, [imageStatus, currentSrc]);

  const handleImageLoad = () => {
    console.log('✅ [EnhancedAvatar] Imagem carregada:', currentSrc);
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    console.log('❌ [EnhancedAvatar] Erro na imagem:', currentSrc);
    setImageStatus('error');
  };

  return (
    <ShadcnAvatar 
      className={cn(
        sizeClassMap[size], 
        className, 
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )} 
      onClick={onClick}
    >
      {/* Mostrar loading apenas se habilitado e carregando */}
      {imageStatus === 'loading' && showLoadingIndicator && currentSrc && (
        <AvatarFallback className="bg-gray-100 flex items-center justify-center">
          <RefreshCw className={cn("animate-spin text-gray-400", loadingSizeMap[size])} />
        </AvatarFallback>
      )}

      {/* Mostrar imagem se carregada */}
      {imageStatus === 'loaded' && currentSrc && (
        <AvatarImage 
          src={currentSrc} 
          alt={alt} 
          onLoad={handleImageLoad} 
          onError={handleImageError}
        />
      )}

      {/* Mostrar fallback se erro ou sem imagem */}
      {(imageStatus === 'error' || !currentSrc || (imageStatus === 'loading' && !showLoadingIndicator)) && (
        <AvatarFallback className="bg-construPro-orange text-white flex items-center justify-center">
          {fallback ? (
            <span className="font-medium">{initials}</span>
          ) : (
            <User size={iconSizeMap[size]} />
          )}
        </AvatarFallback>
      )}
    </ShadcnAvatar>
  );
};

export default EnhancedAvatar;
