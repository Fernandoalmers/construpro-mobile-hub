
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';

interface CartPopupProps {
  triggerShow?: boolean;
}

const CartPopup: React.FC<CartPopupProps> = ({ triggerShow }) => {
  const [show, setShow] = useState(false);
  const { cart, cartCount = 0, isLoading } = useCart();
  const navigate = useNavigate();
  
  console.log('CartPopup rendering:', { triggerShow, cartCount, show, isLoading });
  
  // Show popup when triggerShow changes to true
  useEffect(() => {
    if (triggerShow && cartCount > 0) {
      console.log('CartPopup: triggerShow is true and cart has items, showing popup');
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000); // 5 seconds for better visibility
      
      return () => clearTimeout(timer);
    }
  }, [triggerShow, cartCount]);
  
  // Also show popup when cartCount increases
  useEffect(() => {
    if (cartCount > 0 && cart) {
      console.log('CartPopup: cart updated with items, showing popup');
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [cart, cartCount]);
  
  // Don't show anything during loading or if cart is empty
  if (isLoading || cartCount === 0) {
    return null;
  }
  
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg z-50 w-72 overflow-hidden">
      <div className="p-3 bg-construPro-blue text-white flex justify-between items-center">
        <div className="flex items-center">
          <ShoppingCart size={18} className="mr-2" />
          <span className="font-medium">Item adicionado ao carrinho</span>
        </div>
        <button onClick={() => setShow(false)} className="text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <span className="text-sm text-gray-600">Itens no carrinho:</span>
          <span className="font-bold ml-2">{cartCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => {
              console.log('CartPopup: Navigating to cart page');
              navigate('/cart');
            }}
            variant="outline"
            size="sm"
            className="border-construPro-orange text-construPro-orange hover:bg-construPro-orange/10"
          >
            Ver carrinho
          </Button>
          
          <Button 
            onClick={() => {
              console.log('CartPopup: Navigating to checkout page');
              navigate('/checkout');
            }}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Finalizar compra
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPopup;
