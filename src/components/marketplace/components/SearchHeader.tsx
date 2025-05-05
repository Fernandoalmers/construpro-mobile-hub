
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SearchBar from './SearchBar';
import CartButton from '../CartButton';

interface SearchHeaderProps {
  onGoBack?: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onGoBack }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Add this function to handle search submissions from the product detail page
  const handleSearch = (term: string) => {
    console.log('Search submitted from product detail page:', term);
    if (term.trim().length >= 2) {
      navigate(`/marketplace/products?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div className="bg-white sticky top-0 z-10 shadow-sm border-b pb-2">
      <div className="container mx-auto px-4 pt-4 flex items-center justify-between">
        {/* Back button */}
        <button 
          onClick={handleBackClick}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Voltar"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex-1 mx-3">
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>
        
        <CartButton />
      </div>
    </div>
  );
};

export default SearchHeader;
