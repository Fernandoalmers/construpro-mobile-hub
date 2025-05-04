
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import CustomInput from '../../common/CustomInput';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

interface SearchHeaderProps {
  onGoBack: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onGoBack }) => {
  const navigate = useNavigate();
  const { cartCount = 0 } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="bg-white shadow-sm py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center flex-1 mr-4">
          <button 
            onClick={onGoBack} 
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <CustomInput
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              isSearch
              className="w-full"
            />
          </form>
        </div>
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
