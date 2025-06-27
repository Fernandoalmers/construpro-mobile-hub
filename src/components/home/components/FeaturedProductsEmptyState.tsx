
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, Store } from 'lucide-react';

interface FeaturedProductsEmptyStateProps {
  onChangeCep?: () => void;
}

const FeaturedProductsEmptyState: React.FC<FeaturedProductsEmptyStateProps> = ({
  onChangeCep
}) => {
  const navigate = useNavigate();

  const handleViewAllProducts = () => {
    navigate('/marketplace');
  };

  return (
    <div className="text-center py-8 px-4">
      <div className="max-w-sm mx-auto">
        <div className="mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum produto em destaque para sua região
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          Não encontramos produtos em destaque disponíveis para entrega no seu CEP no momento.
        </p>

        <div className="space-y-3">
          {onChangeCep && (
            <Button
              onClick={onChangeCep}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Alterar CEP
            </Button>
          )}
          
          <Button
            onClick={handleViewAllProducts}
            className="w-full bg-orange-points hover:bg-orange-points/90 text-white flex items-center justify-center gap-2"
          >
            <Store className="h-4 w-4" />
            Ver Todos os Produtos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsEmptyState;
