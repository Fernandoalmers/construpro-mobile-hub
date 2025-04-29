
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import CustomButton from './CustomButton';

interface ListEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300",
        className
      )}
    >
      {icon && <div className="text-gray-400 mb-4">{icon}</div>}
      
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      
      {description && (
        <p className="text-gray-500 mb-4 max-w-xs">{description}</p>
      )}
      
      {action && (
        <CustomButton variant="primary" onClick={action.onClick}>
          {action.label}
        </CustomButton>
      )}
    </div>
  );
};

export default ListEmptyState;
