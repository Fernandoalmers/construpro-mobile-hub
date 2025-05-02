
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import CustomInput from '../common/CustomInput';
import FilterChips from '../common/FilterChips';
import { ArrowLeft, Search, ShoppingBag, Star, ChevronDown, Package, Tag, CircleDollarSign } from 'lucide-react';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';
import ProdutoCard from './ProdutoCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface FilterOption {
  id: string;
  label: string;
}

const MarketplaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [page, setPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<typeof produtos>([]);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);
  const itemsPerPage = 8;
  
  // Parse query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('categoria');
    
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [location.search]);
  
  // Extract unique categories from products
  const allCategories = Array.from(new Set(produtos.map(produto => produto.categoria)))
    .map(category => ({
      id: category,
      label: category
    }));

  // Prepare lojas for filter
  const lojasOptions: FilterOption[] = lojas.map(loja => ({
    id: loja.id,
    label: loja.nome
  }));
  
  // Ratings filter options
  const ratingOptions: FilterOption[] = [
    { id: '4', label: '4★ ou mais' },
    { id: '3', label: '3★ ou mais' },
    { id: '2', label: '2★ ou mais' },
  ];
  
  // Volume/Unit filter options
  const volumeOptions: FilterOption[] = [
    { id: 'litro', label: 'Litros' },
    { id: 'm2', label: 'Metro²' },
    { id: 'unidade', label: 'Unidade' },
    { id: 'pequeno', label: 'Pequeno' },
    { id: 'grande', label: 'Grande' },
  ];

  // Filter products based on search term and filters
  const filteredProdutos = produtos.filter(produto => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(produto.categoria);
    
    // Loja filter
    const matchesLoja = selectedLojas.length === 0 || 
      selectedLojas.includes(produto.lojaId);
    
    // Rating filter (basic simulation for demonstration)
    const matchesRating = selectedRatings.length === 0 || 
      selectedRatings.some(rating => {
        const minRating = parseInt(rating);
        return produto.avaliacao >= minRating;
      });
    
    // Volume filter (simplified)
    const matchesVolume = selectedVolumes.length === 0;
    
    return matchesSearch && matchesCategory && matchesLoja && matchesRating && matchesVolume;
  });

  // Handle scroll events for showing/hiding header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY + 10) {
        setScrollDirection('down');
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY - 10) {
        setScrollDirection('up');
        setHideHeader(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [loadMoreRef, hasMore, page]);

  // Initial load and pagination
  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    
    setDisplayedProducts(filteredProdutos.slice(0, endIndex));
    setHasMore(endIndex < filteredProdutos.length);
  }, [filteredProdutos, page]);

  const loadMoreProducts = () => {
    setPage(prev => prev + 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset pagination when search changes
  };

  const handleLojaClick = (lojaId: string) => {
    // Toggle selection
    if (selectedLojas.includes(lojaId)) {
      setSelectedLojas(selectedLojas.filter(id => id !== lojaId));
    } else {
      setSelectedLojas([...selectedLojas, lojaId]);
    }
    setPage(1); // Reset pagination
  };

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header with search and filters */}
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
          </div>
          
          <CustomInput
            isSearch
            placeholder="Buscar produtos"
            value={searchTerm}
            onChange={handleSearchChange}
            className="mb-4"
          />

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
                        onChange={() => handleLojaClick(loja.id)}
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
                        onChange={() => {
                          if (selectedCategories.includes(category.id)) {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          } else {
                            setSelectedCategories([...selectedCategories, category.id]);
                          }
                        }}
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
                        onChange={() => {
                          if (selectedRatings.includes(rating.id)) {
                            setSelectedRatings(selectedRatings.filter(id => id !== rating.id));
                          } else {
                            setSelectedRatings([rating.id]);
                          }
                        }}
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
                      onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== categoryId))}
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
                      onClick={() => setSelectedLojas(selectedLojas.filter(id => id !== lojaId))}
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
                      onClick={() => setSelectedRatings(selectedRatings.filter(id => id !== ratingId))}
                      className="ml-1 text-gray-500 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
              
              <button 
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedLojas([]);
                  setSelectedRatings([]);
                }}
                className="text-white text-sm underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Product List */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">
            {filteredProdutos.length} produtos encontrados
          </h2>
        </div>

        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayedProducts.map(produto => {
                const loja = lojas.find(l => l.id === produto.lojaId);
                return (
                  <ProdutoCard
                    key={produto.id}
                    produto={produto}
                    loja={loja}
                    onClick={() => navigate(`/produto/${produto.id}`)}
                    onLojaClick={(lojaId) => {
                      setSelectedLojas([lojaId]);
                      setPage(1);
                    }}
                  />
                );
              })}
            </div>
            
            {/* Infinite scroll loading indicator */}
            {hasMore && (
              <div 
                ref={loadMoreRef} 
                className="flex justify-center items-center p-4 mt-4"
              >
                <div className="w-8 h-8 border-4 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag size={48} className="text-gray-400 mb-4" />
            <h3 className="font-bold text-xl mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 text-center mb-6">Tente mudar os filtros ou buscar por outro termo.</p>
            <button 
              className="bg-construPro-blue text-white px-4 py-2 rounded-md"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories([]);
                setSelectedLojas([]);
                setSelectedRatings([]);
                setSelectedVolumes([]);
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceScreen;
