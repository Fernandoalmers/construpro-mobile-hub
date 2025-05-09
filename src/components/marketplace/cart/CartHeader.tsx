
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

const CartHeader: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          
          <h1 className="text-lg sm:text-xl font-semibold flex items-center">
            <ShoppingCart size={20} className="mr-2 text-green-600" />
            Meu Carrinho
          </h1>
          
          <div className={cn("px-2 py-1 rounded-full text-sm font-medium", 
            cartCount > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500")}>
            {cartCount} {cartCount === 1 ? 'item' : 'itens'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartHeader;
