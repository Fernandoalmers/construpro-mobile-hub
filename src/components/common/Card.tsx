
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden", 
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : "",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
