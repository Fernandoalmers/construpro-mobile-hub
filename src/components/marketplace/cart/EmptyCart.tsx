
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg">
        <ShoppingCart size={48} className="text-blue-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Seu carrinho está vazio</h2>
      <p className="text-gray-600 mb-10 max-w-md leading-relaxed">
        Parece que você ainda não adicionou nenhum produto ao seu carrinho. Explore nossos produtos e encontre o que precisa!
      </p>
      
      <Button 
        onClick={() => navigate('/marketplace')}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-semibold"
      >
        Continuar Comprando
      </Button>
    </div>
  );
};

export default EmptyCart;
