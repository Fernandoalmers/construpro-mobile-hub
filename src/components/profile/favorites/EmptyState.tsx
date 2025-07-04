
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Bookmark, ShoppingBag } from 'lucide-react';
import CustomButton from '../../common/CustomButton';

interface EmptyStateProps {
  type: 'recent' | 'favorites' | 'frequent';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const navigate = useNavigate();

  const getEmptyStateConfig = () => {
    switch (type) {
      case 'recent':
        return {
          icon: <Clock className="mx-auto text-gray-400 mb-3" size={40} />,
          title: 'Nenhum produto visualizado recentemente',
          description: 'Explore produtos na loja para vê-los aqui.'
        };
      case 'favorites':
        return {
          icon: <Bookmark className="mx-auto text-gray-400 mb-3" size={40} />,
          title: 'Nenhum produto favorito',
          description: 'Adicione produtos aos favoritos para encontrá-los aqui.'
        };
      case 'frequent':
        return {
          icon: <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />,
          title: 'Nenhum produto comprado ainda',
          description: 'Faça pedidos para ver seus produtos mais comprados aqui.'
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <div className="col-span-2 text-center py-10">
      {config.icon}
      <h3 className="text-lg font-medium text-gray-700">{config.title}</h3>
      {config.description && (
        <p className="text-gray-500 mt-1">{config.description}</p>
      )}
      <CustomButton 
        variant="primary" 
        className="mt-4"
        onClick={() => navigate('/marketplace')}
      >
        Ir para loja
      </CustomButton>
    </div>
  );
};

export default EmptyState;
