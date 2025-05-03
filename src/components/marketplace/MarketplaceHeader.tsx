
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Star, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import CustomInput from '../common/CustomInput';
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

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
    setShowResults(false);
  };
  
  // Real-time search results
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      try {
        setIsSearching(true);
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, 
            nome, 
            preco, 
            imagem_url,
            stores:loja_id (
              nome
            )
          `)
          .ilike('nome', `%${searchTerm.trim()}%`)
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
    
    const debounceTimer = setTimeout(() => {
      searchProducts();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  
  const handleResultClick = (productId: string) => {
    navigate(`/produto/${productId}`);
    setShowResults(false);
  };

  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome
  }));

  return (
    <motion.div 
      className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm"
      initial={{ translateY: 0 }}
      animate={{ 
        translateY: hideHeader ? '-100%' : 0,
        opacity: hideHeader ? 0 : 1
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
        
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
          />
          
          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  onClick={() => handleResultClick(product.id)}
                >
                  <div className="flex items-center">
                    {product.imagem_url && (
                      <img 
                        src={product.imagem_url} 
                        alt={product.nome} 
                        className="w-10 h-10 object-cover rounded-sm mr-2"
                      />
                    )}
                    <div>
                      <p className="text-sm line-clamp-1">{product.nome}</p>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500">{product.stores?.nome}</span>
                        <span className="mx-1">•</span>
                        <span className="font-bold">R$ {product.preco.toFixed(2)}</span>
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
              <div className="grid grid-cols-1 gap-2 mt-4">
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
              <div className="grid grid-cols-1 gap-2 mt-4">
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
  );
};

export default MarketplaceHeader;
