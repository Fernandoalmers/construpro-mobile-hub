
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount = 0, isLoading, cart } = useCart();

  // Calculate count from actual cart items to ensure accuracy
  const actualCount = React.useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  }, [cart?.items]);

  const displayCount = actualCount > 0 ? actualCount : 0;

  console.log('[CartButton] Rendering with:', { 
    cartCount, 
    actualCount, 
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
