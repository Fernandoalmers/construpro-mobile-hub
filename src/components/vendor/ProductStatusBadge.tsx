
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
          label: 'Aprovado',
          classes: 'bg-green-100 text-green-800 border border-green-200'
        };
      case 'inativo':
        return {
          label: 'Inativo',
          classes: 'bg-gray-100 text-gray-800 border border-gray-200'
        };
      case 'rejeitado':
        return {
          label: 'Rejeitado',
          classes: 'bg-red-100 text-red-800 border border-red-200'
        };
      case 'pendente':
        return {
          label: 'Pendente',
          classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        };
      default:
        return {
          label: status || 'Pendente',
          classes: 'bg-gray-100 text-gray-800 border border-gray-200'
        };
    }
  };

  const { label, classes } = getStatusInfo();

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center whitespace-nowrap ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </div>
  );
};

export default ProductStatusBadge;
