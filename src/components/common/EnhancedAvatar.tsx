
import React, { useState, useEffect, useRef } from 'react';
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
  const [hasRetried, setHasRetried] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const sizeClassMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const initials = fallback 
    ? fallback.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset state when src changes
  useEffect(() => {
    if (!src) {
      setImageStatus('error');
      setHasRetried(false);
      return;
    }

    setImageStatus('loading');
    setHasRetried(false);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a 5-second timeout for image loading
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.log('⏰ [EnhancedAvatar] Timeout de carregamento da imagem:', src);
        setImageStatus('error');
      }
    }, 5000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src]);

  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    
    console.log('✅ [EnhancedAvatar] Imagem carregada com sucesso:', src);
    setImageStatus('loaded');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleImageError = () => {
    if (!mountedRef.current) return;
    
    console.log('❌ [EnhancedAvatar] Erro ao carregar imagem:', src);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only retry once and only for network-like errors
    if (!hasRetried && src) {
      console.log('🔄 [EnhancedAvatar] Tentando uma vez mais...');
      setHasRetried(true);
      
      // Simple retry after 1 second without cache buster
      setTimeout(() => {
        if (mountedRef.current) {
          setImageStatus('loading');
        }
      }, 1000);
    } else {
      setImageStatus('error');
    }
  };

  // Determine what to render based on current state
  const shouldShowLoading = imageStatus === 'loading' && showLoadingIndicator && !hasRetried;
  const shouldShowImage = imageStatus === 'loaded' && src;
  const shouldShowFallback = imageStatus === 'error' || !src || (imageStatus === 'loading' && hasRetried);

  return (
    <ShadcnAvatar 
      className={cn(
        sizeClassMap[size], 
        className, 
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )} 
      onClick={onClick}
    >
      {shouldShowLoading && (
        <AvatarFallback className="bg-gray-100 flex items-center justify-center">
          <RefreshCw className={cn(
            "animate-spin text-gray-400",
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
          )} />
        </AvatarFallback>
      )}

      {shouldShowImage && (
        <AvatarImage 
          src={src} 
          alt={alt} 
          onLoad={handleImageLoad} 
          onError={handleImageError}
        />
      )}

      {shouldShowFallback && (
        <AvatarFallback className="bg-construPro-orange text-white flex items-center justify-center">
          {src ? (
            <User size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
          ) : (
            initials
          )}
        </AvatarFallback>
      )}
    </ShadcnAvatar>
  );
};

export default EnhancedAvatar;
