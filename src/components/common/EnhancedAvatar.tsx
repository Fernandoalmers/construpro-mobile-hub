
import React, { useState, useEffect } from 'react';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

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
  showLoadingIndicator = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Get initials from fallback text
  const initials = fallback 
    ? fallback.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      console.log('🖼️ [EnhancedAvatar] Nova URL de avatar:', src);
      setImageLoaded(false);
      setImageError(false);
    } else {
      console.log('🖼️ [EnhancedAvatar] Sem URL de avatar, usando fallback');
      setImageLoaded(false);
      setImageError(true);
    }
  }, [src]);

  const handleImageLoad = () => {
    console.log('✅ [EnhancedAvatar] Avatar carregado com sucesso:', src);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('❌ [EnhancedAvatar] Erro ao carregar avatar:', src);
    setImageLoaded(false);
    setImageError(true);
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
      {/* Always try to show image first if src exists */}
      {src && !imageError && (
        <AvatarImage 
          src={src} 
          alt={alt} 
          onLoad={handleImageLoad} 
          onError={handleImageError}
          className="object-cover"
        />
      )}

      {/* Show fallback if no src, error, or as backup */}
      <AvatarFallback className="bg-construPro-orange text-white flex items-center justify-center">
        {fallback ? (
          <span className="font-medium text-sm">{initials}</span>
        ) : (
          <User size={iconSizeMap[size]} />
        )}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};

export default EnhancedAvatar;
