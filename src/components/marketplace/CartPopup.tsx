
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

interface CartPopupProps {
  className?: string;
}

const CartPopup: React.FC<CartPopupProps> = ({ className }) => {
  const navigate = useNavigate();
  const { cart, showCartPopup, setShowCartPopup } = useCart();

  // Auto-hide the cart popup after 4 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (showCartPopup) {
      timeout = setTimeout(() => {
        setShowCartPopup(false);
      }, 4000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showCartPopup, setShowCartPopup]);

  if (!showCartPopup || !cart) return null;

  const totalItems = cart.items?.length || 0;
  const subtotal = cart.summary?.subtotal || 0;

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-1/2 transform -translate-x-1/2 w-5/6 bg-white rounded-lg shadow-lg z-50 p-4 animate-fade-in border border-gray-200",
        className
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <ShoppingBag size={18} className="text-green-600 mr-2" />
          <span className="font-medium">Produto adicionado ao carrinho</span>
        </div>
        <button 
          onClick={() => setShowCartPopup(false)} 
          className="text-gray-500 hover:bg-gray-100 rounded-full p-1"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Total:</span>
        <span className="font-bold text-base">R$ {subtotal.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <span className="text-gray-600">Itens:</span>
        <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
      </div>
      
      <Button 
        className="w-full bg-green-600 hover:bg-green-700 font-medium"
        onClick={() => {
          navigate('/cart');
          setShowCartPopup(false);
        }}
      >
        Ver Carrinho
      </Button>
    </div>
  );
};

export default CartPopup;
