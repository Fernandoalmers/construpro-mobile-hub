
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
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const sizeClassMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const initials = fallback 
    ? fallback.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageStatus('loading');
      setRetryCount(0);
      
      // Set timeout for image loading (10 seconds)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log('🕐 [EnhancedAvatar] Timeout de carregamento da imagem:', src);
        setImageStatus('error');
      }, 10000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src]);

  const handleImageLoad = () => {
    console.log('✅ [EnhancedAvatar] Imagem carregada com sucesso:', currentSrc);
    setImageStatus('loaded');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleImageError = () => {
    console.log('❌ [EnhancedAvatar] Erro ao carregar imagem:', currentSrc, 'tentativa:', retryCount + 1);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Retry up to 2 times with exponential backoff
    if (retryCount < 2 && currentSrc) {
      const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`🔄 [EnhancedAvatar] Tentando novamente em ${retryDelay}ms...`);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageStatus('loading');
        // Force re-render by adding cache buster
        setCurrentSrc(`${src}?retry=${retryCount + 1}&t=${Date.now()}`);
      }, retryDelay);
    } else {
      setImageStatus('error');
    }
  };

  const renderContent = () => {
    if (imageStatus === 'loading' && showLoadingIndicator) {
      return (
        <div className="flex items-center justify-center">
          <RefreshCw className={cn(
            "animate-spin text-gray-400",
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
          )} />
        </div>
      );
    }

    if (imageStatus === 'loaded' && currentSrc) {
      return <AvatarImage src={currentSrc} alt={alt} onLoad={handleImageLoad} onError={handleImageError} />;
    }

    // Fallback
    return (
      <AvatarFallback className="bg-construPro-orange text-white flex items-center justify-center">
        {currentSrc ? (
          <User size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
        ) : (
          initials
        )}
      </AvatarFallback>
    );
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
      {renderContent()}
    </ShadcnAvatar>
  );
};

export default EnhancedAvatar;
