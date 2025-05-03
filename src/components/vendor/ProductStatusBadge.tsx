
import React from 'react';

interface ProductStatusBadgeProps {
  status: string;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'aprovado':
      case 'ativo':
        return {
          label: 'Ativo',
          classes: 'bg-green-100 text-green-800'
        };
      case 'inativo':
        return {
          label: 'Inativo',
          classes: 'bg-red-100 text-red-800'
        };
      case 'pendente':
        return {
          label: 'Pendente',
          classes: 'bg-amber-100 text-amber-800'
        };
      default:
        return {
          label: status,
          classes: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const { label, classes } = getStatusInfo();

  return (
    <div className={`px-2 py-0.5 rounded-full text-xs inline-flex items-center ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </div>
  );
};

export default ProductStatusBadge;
