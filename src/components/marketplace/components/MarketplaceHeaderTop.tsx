
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin } from 'lucide-react';
import ViewTypeSelector from './ViewTypeSelector';

interface MarketplaceHeaderTopProps {
  cartCount: number;
  viewType?: 'grid' | 'list';
  setViewType?: (type: 'grid' | 'list') => void;
  currentCep?: string | null;
  onChangeCep?: () => void;
}

const MarketplaceHeaderTop: React.FC<MarketplaceHeaderTopProps> = ({ 
  cartCount, 
  viewType = 'grid', 
  setViewType = () => {},
  currentCep,
  onChangeCep
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const formatCep = (cep: string) => cep.replace(/(\d{5})(\d{3})/, '$1-$2');

  return (
    <div className="flex items-center justify-between mb-1 sm:mb-2">
      {/* Left side - Back button and title */}
      <div className="flex items-center">
        <button 
          onClick={handleBackClick}
          className="mr-2 sm:mr-3 text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} className="sm:hidden" />
          <ArrowLeft size={24} className="hidden sm:block" />
        </button>
        <h1 className="text-lg sm:text-2xl font-bold text-white">Loja</h1>
      </div>
      
      {/* Right side - CEP button (desktop only), View selector and Cart button */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* CEP Button - Only visible on desktop */}
        {currentCep && onChangeCep && (
          <button
            onClick={onChangeCep}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
            aria-label={`CEP atual: ${formatCep(currentCep)}. Clique para alterar`}
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden lg:inline">CEP:</span>
            <span className="font-mono">{formatCep(currentCep)}</span>
          </button>
        )}
        
        {/* View Type Selector */}
        <ViewTypeSelector 
          viewType={viewType}
          setViewType={setViewType}
        />
        
        {/* Cart Button */}
        <button 
          onClick={handleCartClick}
          className="relative p-2 sm:p-3 text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={`Carrinho com ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
        >
          <ShoppingBag size={20} strokeWidth={2} className="sm:hidden" />
          <ShoppingBag size={24} strokeWidth={2} className="hidden sm:block" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-destructive text-destructive-foreground rounded-full min-w-[18px] h-4.5 sm:min-w-[20px] sm:h-5 flex items-center justify-center text-xs font-semibold px-1 shadow-sm">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarketplaceHeaderTop;
