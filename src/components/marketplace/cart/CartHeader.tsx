
import React from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-20 border-b border-gray-100">
      <button 
        onClick={() => navigate('/marketplace')} 
        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors" 
        aria-label="Voltar para o marketplace"
      >
        <ArrowLeft size={22} />
      </button>
      <div className="flex items-center">
        <ShoppingCart size={24} className="text-green-600 mr-2" />
        <h1 className="text-xl font-bold">Seu Carrinho</h1>
      </div>
    </div>
  );
};

export default CartHeader;
