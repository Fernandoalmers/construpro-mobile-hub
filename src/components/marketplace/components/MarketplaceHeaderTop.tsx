
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import ViewTypeSelector from './ViewTypeSelector';

interface MarketplaceHeaderTopProps {
  cartCount: number;
  viewType?: 'grid' | 'list';
  setViewType?: (type: 'grid' | 'list') => void;
}

const MarketplaceHeaderTop: React.FC<MarketplaceHeaderTopProps> = ({ 
  cartCount, 
  viewType = 'grid', 
  setViewType = () => {} 
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="flex items-center justify-between mb-2">
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
      
      {/* Right side - View selector and Cart button */}
      <div className="flex items-center space-x-2">
        {/* Posição 1 - Seletor de grade/lista */}
        <ViewTypeSelector 
          viewType={viewType}
          setViewType={setViewType}
        />
        
        {/* Posição 2 - Sacolinha */}
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
