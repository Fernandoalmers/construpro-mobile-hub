
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

const CartPopup: React.FC = () => {
  const [show, setShow] = useState(false);
  const { cart, cartCount = 0, isLoading } = useCart();
  const navigate = useNavigate();
  
  // Show popup briefly when cart is updated
  useEffect(() => {
    if (cartCount && cartCount > 0) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [cartCount]);
  
  // Don't show anything while loading or if cart is empty
  if (isLoading || !cart || cartCount === 0) {
    return null;
  }
  
  if (!show) return null;

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
          <button 
            onClick={() => navigate('/cart')}
            className="bg-construPro-orange hover:bg-construPro-orange/90 text-white px-4 py-2 rounded text-sm"
          >
            Ver carrinho
          </button>
          
          <button 
            onClick={() => navigate('/checkout')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPopup;
