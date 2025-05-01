
import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface CustomButtonProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className,
  onClick,
  disabled,
  fullWidth,
  type = "button",
  icon,
  iconPosition = 'left',
  loading = false
}) => {
  // Map our custom variants to the button variants and styles
  const variantClassMap = {
    default: '',
    primary: 'bg-construPro-orange hover:bg-orange-600 text-white',
    secondary: 'bg-construPro-blue hover:bg-blue-800 text-white',
    outline: 'bg-white border border-construPro-orange text-construPro-orange hover:bg-orange-50',
    link: 'text-construPro-blue hover:underline p-0'
  };
  
  const sizeClassMap = {
    sm: 'text-sm px-3 py-1',
    md: 'px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant === 'primary' || variant === 'secondary' ? 'default' : variant === 'outline' ? 'outline' : variant === 'link' ? 'link' : 'default'}
      className={cn(
        variantClassMap[variant],
        sizeClassMap[size],
        fullWidth ? 'w-full' : '',
        'flex items-center justify-center gap-2 transition-all',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && iconPosition === 'left' && icon
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </Button>
  );
};

export default CustomButton;
