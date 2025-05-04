
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Star, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { FilterOption } from '@/hooks/use-product-filter';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceHeaderProps {
  hideHeader: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  stores?: any[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  clearFilters: () => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  allCategories,
  ratingOptions,
  stores = [],
  onSearchChange,
  onSearch,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  clearFilters
}) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchTerm) {
      onSearch(searchTerm);
    }
    setShowResults(false);
  };
  
  // Debounced real-time search with 300ms delay
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
  
  // Fetch search results
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

  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome
  }));

  // Add click outside handler to close search results
  useEffect(() => {
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
    <AnimatePresence>
      <motion.div 
        className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm"
        initial={{ translateY: 0 }}
        animate={{ 
          translateY: hideHeader ? '-60%' : 0,
          opacity: hideHeader ? 0.5 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-construPro-blue p-4 pt-8">
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
              >
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
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
            {showResults && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1 max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => handleResultClick(product.id)}
                  >
                    <div className="flex items-center">
                      {product.imagem_url && (
                        <img 
                          src={product.imagem_url} 
                          alt={product.nome} 
                          className="w-12 h-12 object-contain rounded-sm mr-3 bg-white border border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">{product.nome}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {product.stores?.nome}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-sm">
                              R$ {product.preco?.toFixed(2)}
                            </span>
                            {product.preco_anterior > product.preco && (
                              <span className="text-xs text-gray-400 line-through">
                                R$ {product.preco_anterior?.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="flex space-x-2 overflow-x-auto pb-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                  Loja <ChevronDown size={16} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar por Loja</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
                  {lojasOptions.map(loja => (
                    <label key={loja.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        className="mr-2" 
                        checked={selectedLojas.includes(loja.id)} 
                        onChange={() => onLojaClick(loja.id)}
                      />
                      {loja.label}
                    </label>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                  Categoria <ChevronDown size={16} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar por Categoria</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
                  {allCategories.map(category => (
                    <label key={category.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        className="mr-2" 
                        checked={selectedCategories.includes(category.id)} 
                        onChange={() => onCategoryClick(category.id)}
                      />
                      {category.label}
                    </label>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                  Avaliação <ChevronDown size={16} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar por Avaliação</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {ratingOptions.map(rating => (
                    <label key={rating.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        className="mr-2" 
                        checked={selectedRatings.includes(rating.id)} 
                        onChange={() => onRatingClick(rating.id)}
                      />
                      <span className="flex items-center">
                        {rating.label} <Star size={16} className="ml-1 fill-yellow-400 text-yellow-400" />
                      </span>
                    </label>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Price filter */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                  Preço <ChevronDown size={16} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar por Preço</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <div className="flex flex-col space-y-4">
                    {[
                      { id: 'preco-1', label: 'Até R$ 50' },
                      { id: 'preco-2', label: 'R$ 50 a R$ 100' },
                      { id: 'preco-3', label: 'R$ 100 a R$ 200' },
                      { id: 'preco-4', label: 'R$ 200 a R$ 500' },
                      { id: 'preco-5', label: 'Acima de R$ 500' }
                    ].map(option => (
                      <label key={option.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox"
                          className="mr-2" 
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Selected filters */}
          {(selectedCategories.length > 0 || selectedLojas.length > 0 || selectedRatings.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCategories.map(categoryId => {
                const category = allCategories.find(c => c.id === categoryId);
                return (
                  <Badge key={categoryId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
                    {category?.label}
                    <button 
                      onClick={() => onCategoryClick(categoryId)}
                      className="ml-1 text-gray-500 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
              
              {selectedLojas.map(lojaId => {
                const loja = lojasOptions.find(l => l.id === lojaId);
                return (
                  <Badge key={lojaId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
                    {loja?.label}
                    <button 
                      onClick={() => onLojaClick(lojaId)}
                      className="ml-1 text-gray-500 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
              
              {selectedRatings.map(ratingId => {
                const rating = ratingOptions.find(r => r.id === ratingId);
                return (
                  <Badge key={ratingId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
                    {rating?.label}
                    <button 
                      onClick={() => onRatingClick(ratingId)}
                      className="ml-1 text-gray-500 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
              
              <button 
                onClick={clearFilters}
                className="text-white text-sm underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarketplaceHeader;
