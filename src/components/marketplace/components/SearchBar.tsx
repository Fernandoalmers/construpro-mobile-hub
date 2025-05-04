
import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SearchResults from './SearchResults';
import { useNavigate } from 'react-router-dom';

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
      setIsSearching(true);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          nome, 
          preco, 
          preco_anterior,
          imagem_url,
          stores:loja_id (
            id,
            nome
          )
        `)
        .ilike('nome', `%${query.trim()}%`)
        .limit(5);
        
      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(data && data.length > 0);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleResultClick = (productId: string) => {
    navigate(`/produto/${productId}`);
    setShowResults(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchTerm) {
      onSearch(searchTerm);
    }
    setShowResults(false);
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
    <form onSubmit={handleSearchSubmit} className="relative mb-4 search-container">
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
      />
      
      {/* Search loading indicator */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-construPro-blue"></div>
        </div>
      )}
      
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
