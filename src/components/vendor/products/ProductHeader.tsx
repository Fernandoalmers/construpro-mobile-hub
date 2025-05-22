
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductHeaderProps {
  onNewProduct: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ onNewProduct }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-construPro-blue p-6 pt-12 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={() => navigate('/vendor')} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <ShoppingBag className="text-white mr-2" size={24} />
        <h1 className="text-xl font-bold text-white">Gerenciar Produtos</h1>
      </div>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={onNewProduct}
        className="flex items-center gap-1"
      >
        <Plus size={16} />
        Novo Produto
      </Button>
    </div>
  );
};

export default ProductHeader;
