
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount, isLoading, cart } = useCart();

  // Use the centralized cartCount directly from context - no additional calculations
  const displayCount = cartCount > 0 ? cartCount : 0;

  console.log('[CartButton] Rendering with:', { 
    cartCount, 
    displayCount, 
    isLoading,
    itemsLength: cart?.items?.length || 0
  });

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => navigate('/cart')}
        aria-label={`Ver carrinho com ${displayCount} item(s)`}
      >
        <ShoppingCart size={22} />
        {displayCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {displayCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default CartButton;
