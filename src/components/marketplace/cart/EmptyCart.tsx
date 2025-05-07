
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <ShoppingCart size={40} className="text-gray-400" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Parece que você ainda não adicionou nenhum produto ao seu carrinho.
      </p>
      
      <Button 
        onClick={() => navigate('/marketplace')}
        className="bg-construPro-blue hover:bg-blue-700 text-white px-6 py-2"
      >
        Continuar Comprando
      </Button>
    </div>
  );
};

export default EmptyCart;
