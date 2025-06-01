
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarketplaceHeaderTopProps {
  cartCount: number;
}

const MarketplaceHeaderTop: React.FC<MarketplaceHeaderTopProps> = ({ cartCount }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  return (
    <div className="flex items-center mb-4">
      <button 
        onClick={handleBackClick}
        className="mr-3 text-white hover:bg-white/10 p-1 rounded-full"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-2xl font-bold text-white">Produtos</h1>
      
      {/* Cart icon with count */}
      <div className="ml-auto">
        <button 
          onClick={() => navigate('/cart')} 
          className="relative text-white"
          aria-label={`Carrinho com ${cartCount} itens`}
        >
          <ShoppingBag size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarketplaceHeaderTop;
