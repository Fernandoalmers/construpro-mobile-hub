
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import SearchBar from './SearchBar';
import ViewTypeSelector from './ViewTypeSelector';

interface FixedHeaderTopProps {
  cartCount: number;
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
}

const FixedHeaderTop: React.FC<FixedHeaderTopProps> = ({
  cartCount,
  viewType,
  setViewType,
  searchTerm,
  onSearchChange,
  onSearch
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="bg-construPro-blue p-2 sm:p-4 pt-4 sm:pt-8">
      {/* Header Top with Back Button, Title, View Selector and Cart */}
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
          <h1 className="text-lg sm:text-2xl font-bold text-white">Produtos</h1>
        </div>
        
        {/* Right side - View selector and Cart button */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <ViewTypeSelector 
            viewType={viewType}
            setViewType={setViewType}
          />
          
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
      
      {/* Search Bar */}
      <div className="mt-1.5 sm:mt-3">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={onSearchChange} 
          onSearch={onSearch} 
          showSuggestions={false} 
        />
      </div>
    </div>
  );
};

export default FixedHeaderTop;
