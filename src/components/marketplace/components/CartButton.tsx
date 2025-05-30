
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount = 0, isLoading } = useCart();
  
  // Force re-render when cartCount changes with timestamp
  const [updateKey, setUpdateKey] = React.useState(0);

  console.log('[CartButton] Rendering with:', { 
    cartCount, 
    isLoading,
    updateKey,
    timestamp: new Date().toISOString()
  });

  // Force re-render when cartCount changes
  React.useEffect(() => {
    console.log('[CartButton] Cart count changed to:', cartCount);
    setUpdateKey(prev => prev + 1);
  }, [cartCount]);

  // Additional force update mechanism
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Subtle check to ensure UI stays in sync
      setUpdateKey(prev => prev + 1);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" key={`cart-button-${updateKey}`}>
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
            key={`badge-${cartCount}-${updateKey}`} // Force re-render with unique key
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
