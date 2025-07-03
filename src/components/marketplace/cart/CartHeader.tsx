
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

const CartHeader: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount, isLoading } = useCart();
  
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-lg">
      <div className="max-w-2xl mx-auto px-3">
        <div className="h-12 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 p-2 -ml-2 rounded-xl hover:bg-gray-100/80 hover:scale-105"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span className="hidden sm:inline font-medium text-sm">Voltar</span>
          </button>
          
          <div className="flex items-center">
            <h1 className="text-sm sm:text-base font-bold flex items-center text-gray-800">
              <ShoppingCart size={18} className="mr-2 text-blue-600" />
              Meu Carrinho
            </h1>
            {cartCount > 0 && (
              <Sparkles size={12} className="ml-1 text-yellow-500 animate-pulse" />
            )}
          </div>
          
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200", 
            isLoading ? "bg-gray-100 text-gray-400 border-gray-200" : 
            cartCount > 0 ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 shadow-sm" : "bg-gray-100 text-gray-500 border-gray-200"
          )}>
            {isLoading ? "..." : cartCount} {cartCount === 1 ? 'item' : 'itens'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartHeader;
