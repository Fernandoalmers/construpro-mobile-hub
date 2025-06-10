
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface MarketplaceHeaderTopProps {
  cartCount: number;
}

const MarketplaceHeaderTop: React.FC<MarketplaceHeaderTopProps> = ({ cartCount }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left side - Back button and title */}
      <div className="flex items-center">
        <button 
          onClick={handleBackClick}
          className="mr-3 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
      </div>
      
      {/* Right side - Cart button with improved styling */}
      <div className="flex items-center">
        <button 
          onClick={handleCartClick}
          className="relative p-3 text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={`Carrinho com ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
        >
          <ShoppingBag size={24} strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-semibold px-1 shadow-sm">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarketplaceHeaderTop;
