
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import CustomInput from '../common/CustomInput';
import FilterChips from '../common/FilterChips';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Search, ShoppingBag, Star, ChevronDown, Package, Tag, CircleDollarSign } from 'lucide-react';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';
import ProdutoCard from './ProdutoCard';
import { AnimatePresence, motion } from 'framer-motion';

interface FilterOption {
  id: string;
  label: string;
}

const MarketplaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [page, setPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<typeof produtos>([]);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);
  const itemsPerPage = 8;
  
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
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY - 10) {
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
          <h1 className="text-2xl font-bold text-white mb-4">Marketplace</h1>
          
          <CustomInput
            isSearch
            placeholder="Buscar produtos"
            value={searchTerm}
            onChange={handleSearchChange}
            className="mb-4"
          />

          <div className="space-y-4 pb-2">
            <div>
              <p className="text-white text-sm mb-2">Lojas</p>
              <div className="overflow-x-auto">
                <div className="inline-flex pb-2">
                  <FilterChips
                    items={lojasOptions}
                    selectedIds={selectedLojas}
                    onChange={setSelectedLojas}
                    allowMultiple
                  />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-white text-sm mb-2">Categorias</p>
              <div className="overflow-x-auto">
                <div className="inline-flex pb-2">
                  <FilterChips
                    items={allCategories}
                    selectedIds={selectedCategories}
                    onChange={setSelectedCategories}
                    allowMultiple
                  />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-white text-sm mb-2">Avaliação</p>
              <div className="overflow-x-auto">
                <div className="inline-flex pb-2">
                  <FilterChips
                    items={ratingOptions}
                    selectedIds={selectedRatings}
                    onChange={setSelectedRatings}
                    allowMultiple={false}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-white text-sm mb-2">Unidade/Volume</p>
              <div className="overflow-x-auto">
                <div className="inline-flex pb-2">
                  <FilterChips
                    items={volumeOptions}
                    selectedIds={selectedVolumes}
                    onChange={setSelectedVolumes}
                    allowMultiple
                  />
                </div>
              </div>
            </div>
          </div>
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
          <ListEmptyState
            title="Nenhum produto encontrado"
            description="Tente mudar os filtros ou buscar por outro termo."
            icon={<ShoppingBag size={40} />}
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchTerm('');
                setSelectedCategories([]);
                setSelectedLojas([]);
                setSelectedRatings([]);
                setSelectedVolumes([]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceScreen;
