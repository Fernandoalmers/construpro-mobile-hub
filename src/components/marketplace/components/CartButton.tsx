
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount = 0, isLoading } = useCart();

  console.log('CartButton rendering with count:', cartCount, 'isLoading:', isLoading);

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
          <span className="absolute -top-1 -right-1 bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default CartButton;
