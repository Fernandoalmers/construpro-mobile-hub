
import React from 'react';
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

  if (!showCartPopup || !cart) return null;

  const totalItems = cart.items?.length || 0;
  const subtotal = cart.summary?.subtotal || 0;

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-1/2 transform -translate-x-1/2 w-5/6 bg-white rounded-lg shadow-lg z-50 p-4",
        className
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <ShoppingBag size={18} className="text-construPro-blue mr-2" />
          <span className="font-medium">Carrinho</span>
        </div>
        <button onClick={() => setShowCartPopup(false)} className="text-gray-500">
          <X size={18} />
        </button>
      </div>

      <div className="flex justify-between text-sm mb-1">
        <span>Total:</span>
        <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <span>Itens:</span>
        <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
      </div>
      
      <Button 
        className="w-full bg-construPro-blue hover:bg-construPro-blue/90"
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
