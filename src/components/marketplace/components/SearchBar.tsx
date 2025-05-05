
import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SearchResults from './SearchResults';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch
}) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e);
    const query = e.target.value;
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for the search
    if (query.trim().length >= 2) {
      searchTimeoutRef.current = window.setTimeout(() => {
        fetchSearchResults(query);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };
  
  const fetchSearchResults = async (query: string) => {
    try {
      console.log('Searching products for query:', query);
      setIsSearching(true);
      
      // Search in the 'produtos' table with correct column names
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id, 
          nome, 
          preco_normal,
          preco_promocional,
          vendedor_id,
          descricao,
          imagem_url
        `)
        .ilike('nome', `%${query.trim()}%`)
        .limit(5);
        
      if (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      console.log('Search results:', data);
      
      // Map the results to the expected format
      const mappedResults = Array.isArray(data) ? data.map(produto => {
        return {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco_promocional || produto.preco_normal,
          preco_normal: produto.preco_normal,
          preco_promocional: produto.preco_promocional,
          imagem_url: produto.imagem_url, // Use image URL if available
          vendedor_id: produto.vendedor_id,
          stores: { id: produto.vendedor_id, nome: 'Loja' } // Simplified
        };
      }) : [];
      
      setSearchResults(mappedResults);
      setShowResults(mappedResults.length > 0);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleResultClick = (productId: string) => {
    console.log('Search result clicked, navigating to product:', productId);
    navigate(`/produto/${productId}`);
    setShowResults(false);
  };

  // Handle explicit search via button click or Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search form submitted with term:', searchTerm);
    
    if (searchTerm.trim().length < 2) {
      console.log('Search term too short, not searching');
      return;
    }

    // Close search results dropdown
    setShowResults(false);
    
    // Use provided onSearch handler if available
    if (onSearch) {
      console.log('Calling provided onSearch handler');
      onSearch(searchTerm);
    } else {
      // Default behavior: navigate to marketplace with search parameter
      console.log('Navigating to marketplace with search term');
      navigate(`/marketplace/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed in search input');
      handleSearchSubmit(e);
    }
  };

  // Add click outside handler to close search results
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container') && showResults) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResults]);

  return (
    <form onSubmit={handleSearchSubmit} className="relative mb-4 search-container flex items-center">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
        />
        
        {/* Search loading indicator */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-construPro-blue"></div>
          </div>
        )}
      </div>
      
      {/* Search button */}
      <Button 
        type="submit" 
        variant="default"
        size="sm"
        className="ml-2"
        onClick={(e) => handleSearchSubmit(e)}
      >
        <Search size={16} className="mr-1" />
        Buscar
      </Button>
      
      {/* Search results dropdown */}
      <SearchResults 
        searchResults={searchResults}
        showResults={showResults}
        onResultClick={handleResultClick}
      />
    </form>
  );
};

export default SearchBar;
