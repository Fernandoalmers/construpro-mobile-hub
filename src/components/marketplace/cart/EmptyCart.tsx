
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg shadow my-6">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <ShoppingCart size={64} className="text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Adicione produtos ao seu carrinho para continuar com suas compras para sua obra ou reforma
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button 
          variant="outline"
          size="lg"
          className="flex-1 gap-2" 
          onClick={() => navigate(-1)}
        >
          Continuar Comprando
        </Button>
        <Button
          variant="default"
          size="lg"
          className="flex-1 gap-2 bg-construPro-blue hover:bg-blue-700"
          onClick={() => navigate('/marketplace')}
        >
          <ShoppingBag size={20} />
          Ir para Marketplace
        </Button>
      </div>
    </div>
  );
};

export default EmptyCart;
