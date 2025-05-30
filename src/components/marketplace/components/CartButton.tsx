
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount = 0, isLoading } = useCart();

  console.log('[CartButton] Rendering with:', { 
    cartCount, 
    isLoading,
    timestamp: new Date().toISOString()
  });

  // Force re-render when cartCount changes
  React.useEffect(() => {
    console.log('[CartButton] Cart count changed to:', cartCount);
  }, [cartCount]);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => navigate('/cart')}
        aria-label={`Ver carrinho com ${cartCount} item(s)`}
      >
        <ShoppingCart size={22} />
        {cartCount > 0 && (
          <span 
            key={cartCount} // Force re-render with key
            className="absolute -top-1 -right-1 bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
            style={{
              animation: cartCount > 0 ? 'pulse 0.5s ease-in-out' : 'none'
            }}
          >
            {cartCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default CartButton;
