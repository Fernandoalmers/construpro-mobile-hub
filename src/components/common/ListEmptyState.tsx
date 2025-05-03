
import React, { ReactNode } from 'react';
import CustomButton from './CustomButton';

type ListEmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 ${className}`}>
      {icon && (
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 mb-6">{description}</p>
      {action && (
        <CustomButton 
          variant="primary"
          onClick={action.onClick}
        >
          {action.label}
        </CustomButton>
      )}
    </div>
  );
};

export default ListEmptyState;
