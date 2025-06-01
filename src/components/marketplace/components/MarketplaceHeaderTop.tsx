
import React from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/use-cart';

interface MarketplaceHeaderTopProps {
  showBackButton?: boolean;
  title?: string;
}

export const MarketplaceHeaderTop: React.FC<MarketplaceHeaderTopProps> = ({
  showBackButton = false,
  title = "Marketplace"
}) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="relative text-white hover:bg-white/20"
        onClick={() => navigate('/marketplace/cart')}
      >
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Button>
    </div>
  );
};
