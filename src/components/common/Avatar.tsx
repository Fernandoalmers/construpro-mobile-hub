
import React from 'react';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  fallback,
  size = 'md',
  className,
  onClick,
}) => {
  const sizeClassMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const initials = fallback 
    ? fallback.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <ShadcnAvatar 
      className={cn(
        sizeClassMap[size], 
        className, 
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )} 
      onClick={onClick}
    >
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback className="bg-construPro-orange text-white flex items-center justify-center">
        {src ? <User size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} /> : initials}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};

export default Avatar;
