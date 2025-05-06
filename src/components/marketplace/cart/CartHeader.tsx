
import React from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 flex items-center shadow-sm">
      <button onClick={() => navigate(-1)} className="mr-4" aria-label="Voltar">
        <ArrowLeft size={24} />
      </button>
      <div className="flex items-center">
        <ShoppingCart size={24} className="text-construPro-blue mr-2" />
        <h1 className="text-xl font-bold">Carrinho de Compras</h1>
      </div>
    </div>
  );
};

export default CartHeader;
