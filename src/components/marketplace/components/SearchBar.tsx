

import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SearchResults from './SearchResults';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { trackProductView } from '@/hooks/product/useProductTracking';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  showSuggestions?: boolean; // Nova prop para controlar as sugestões
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  showSuggestions = false // Por padrão, não mostra sugestões
}) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e);
    const query = e.target.value;
    console.log('[SearchBar] Input changed:', query);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Only show suggestions if enabled and query is long enough
    if (showSuggestions && query.trim().length >= 2) {
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
      console.log('[SearchBar] 🔍 Fetching search results for query:', query);
      setIsSearching(true);
      
      // FIXED: Search ONLY in product name and description, NOT in categories
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id, 
          nome, 
          preco_normal,
          preco_promocional,
          vendedor_id,
          descricao,
          imagens,
          categoria
        `)
        .or(`nome.ilike.%${query.trim()}%,descricao.ilike.%${query.trim()}%`)
        .eq('status', 'aprovado')
        .limit(5);
        
      if (error) {
        console.error('[SearchBar] Error searching products:', error);
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      console.log('[SearchBar] 🔍 Search results for "' + query + '":', data?.length || 0, 'products found');
      
      // Log each product found to debug the issue
      if (data && data.length > 0) {
        data.forEach((produto, index) => {
          console.log(`[SearchBar] 📦 Product ${index + 1}:`, {
            nome: produto.nome,
            categoria: produto.categoria,
            nameMatch: produto.nome?.toLowerCase().includes(query.toLowerCase()),
            descriptionMatch: produto.descricao?.toLowerCase().includes(query.toLowerCase())
          });
        });
      }
      
      // Map the results to the expected format
      const mappedResults = Array.isArray(data) ? data.map(produto => {
        // Extract first image from the imagens JSON array
        let imageUrl = null;
        if (produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0) {
          imageUrl = produto.imagens[0];
        }
        
        return {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco_promocional || produto.preco_normal,
          preco_anterior: produto.preco_promocional ? produto.preco_normal : null,
          imagem_url: imageUrl, // Use the first image from the array
          vendedor_id: produto.vendedor_id,
          stores: { id: produto.vendedor_id, nome: 'Loja' } // Simplified
        };
      }) : [];
      
      setSearchResults(mappedResults);
      setShowResults(mappedResults.length > 0);
    } catch (error) {
      console.error('[SearchBar] Error searching products:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleResultClick = (productId: string) => {
    console.log('[SearchBar] Search result clicked, navigating to product:', productId);
    trackProductView(productId);
    navigate(`/produto/${productId}`);
    setShowResults(false);
  };

  // Handle explicit search via button click or Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SearchBar] 🔍 Search form submitted with term:', searchTerm);
    
    if (searchTerm.trim().length < 2) {
      console.log('[SearchBar] Search term too short, not searching');
      return;
    }

    // Close search results dropdown
    setShowResults(false);
    
    // Use provided onSearch handler if available
    if (onSearch) {
      console.log('[SearchBar] Calling provided onSearch handler');
      onSearch(searchTerm);
    } else {
      // Default behavior: navigate to marketplace with search parameter
      const searchUrl = `/marketplace/products?search=${encodeURIComponent(searchTerm)}`;
      console.log('[SearchBar] Navigating to:', searchUrl);
      navigate(searchUrl);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('[SearchBar] Enter key pressed in search input');
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
    <form onSubmit={handleSearchSubmit} className="relative mb-2 sm:mb-4 search-container flex items-center">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
          data-testid="search-input"
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
        className="ml-1.5 sm:ml-2 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
        onClick={(e) => handleSearchSubmit(e)}
        data-testid="search-button"
      >
        <Search size={14} className="mr-0.5 sm:mr-1 sm:hidden" />
        <Search size={16} className="mr-1 hidden sm:block" />
        <span className="hidden sm:inline">Buscar</span>
      </Button>
      
      {/* Search results dropdown - só mostra se showSuggestions for true */}
      {showSuggestions && (
        <SearchResults 
          searchResults={searchResults}
          showResults={showResults}
          onResultClick={handleResultClick}
        />
      )}
    </form>
  );
};

export default SearchBar;
