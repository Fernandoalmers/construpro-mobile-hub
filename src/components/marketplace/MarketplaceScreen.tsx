
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import MarketplaceHeader from './MarketplaceHeader';
import ProductListSection from './ProductListSection';
import SegmentCardsHeader from './components/SegmentCardsHeader';
import { getProducts } from '@/services/productService';
import { getStores, Store } from '@/services/marketplace/marketplaceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import LoadingState from '../common/LoadingState';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';

const MarketplaceScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const searchQuery = searchParams.get('search');
  const segmentParam = searchParams.get('segmento');
  
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(segmentParam);
  
  // Use our custom hooks
  const { hideHeader } = useScrollBehavior();
  
  // Fetch products and stores from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products
        const productsData = await getProducts();
        setProducts(productsData);
        
        // Fetch stores
        try {
          const storesData = await getStores();
          setStores(storesData);
        } catch (storeError) {
          console.error('Error fetching stores:', storeError);
          setStoresError((storeError as Error).message || 'Erro ao carregar lojas');
          toast.error('Erro ao carregar lojas');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Extract all categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.categoria));
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [products]);
  
  // Filter products based on segment as well
  const {
    selectedCategories,
    selectedLojas,
    selectedRatings,
    ratingOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    handleSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters,
    setSelectedLojas,
    setPage
  } = useProductFilter({ 
    initialCategories, 
    initialProducts: products.filter(p => !selectedSegment || p.segmento === selectedSegment),
    initialSearch: searchQuery || '' 
  });

  // Add debouncing for instant search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        console.log('Debounced search for:', searchTerm);
        handleSearchChange(searchTerm);
        
        // Update URL with search parameter
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchTerm) {
          newSearchParams.set('search', searchTerm);
        } else {
          newSearchParams.delete('search');
        }
        navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [searchTerm, location.pathname, handleSearchChange, navigate]);

  // Handle segment selection
  const handleSegmentClick = (segmentId: string) => {
    // Toggle segment selection
    const newSegment = selectedSegment === segmentId ? null : segmentId;
    setSelectedSegment(newSegment);
    
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSegment) {
      newSearchParams.set('segmento', newSegment);
    } else {
      newSearchParams.delete('segmento');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    
    // Reset page
    setPage(1);
  };

  // Handle loja click from product card
  const handleLojaCardClick = (lojaId: string) => {
    setSelectedLojas([lojaId]);
    setPage(1);
  };

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // The handleSearchChange will be triggered by the debounced effect
  };

  // Quick search for products
  const handleQuickSearch = async (term: string) => {
    if (!term || term.trim().length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .ilike('nome', `%${term}%`)
        .limit(1)
        .single();
      
      if (error || !data) return;
      
      // Navigate to first product that matches the search
      navigate(`/produto/${data.id}`);
    } catch (error) {
      console.error('Error in quick search:', error);
    }
  };

  // Current category name for display
  const currentCategoryName = selectedCategories.length === 1 ? 
    categories.find(cat => cat.id === selectedCategories[0])?.label : 
    selectedSegment ? 
      "Produtos no segmento selecionado" : 
      "Todos os Produtos";

  // Simple store card component
  const StoreCard: React.FC<{ store: Store }> = ({ store }) => {
    return (
      <Card 
        className="p-3 flex flex-col items-center justify-center gap-2"
        onClick={() => handleLojaClick(store.id)}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
          {store.logo_url ? (
            <img 
              src={store.logo_url} 
              alt={store.nome_loja} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl font-semibold text-gray-400">
              {store.nome_loja.charAt(0)}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-center line-clamp-2">
          {store.nome_loja}
        </span>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header with search and filters */}
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={searchTerm}
        selectedCategories={selectedCategories}
        selectedLojas={selectedLojas}
        selectedRatings={selectedRatings}
        allCategories={categories}
        ratingOptions={ratingOptions}
        onSearchChange={handleSearchInputChange}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        onSearch={handleQuickSearch}
        clearFilters={clearFilters}
        stores={stores}
      />
      
      {/* Segment Cards */}
      <SegmentCardsHeader 
        selectedSegment={selectedSegment} 
        onSegmentClick={handleSegmentClick}
      />
      
      {/* Stores Section */}
      {stores.length > 0 && (
        <div className="px-3 py-4 bg-white border-b">
          <h2 className="text-lg font-semibold mb-3">Lojas Disponíveis</h2>
          <div className="grid grid-cols-4 gap-3">
            {stores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      )}
      
      {/* Simple category header */}
      <div className="bg-white px-3 py-2 border-b shadow-sm">
        <div className="flex items-center">
          <span className="text-sm font-medium">{currentCategoryName}</span>
          <span className="text-xs text-gray-500 mx-2">({filteredProdutos.length})</span>
        </div>
      </div>
      
      {/* Product List */}
      <div className="px-2 py-2 flex-1">
        {isLoading ? (
          <LoadingState type="spinner" text="Carregando produtos..." count={3} />
        ) : (
          <ProductListSection 
            displayedProducts={displayedProducts}
            filteredProdutos={filteredProdutos}
            hasMore={hasMore}
            loadMoreProducts={loadMoreProducts}
            clearFilters={clearFilters}
            onLojaClick={handleLojaCardClick}
            isLoading={isLoading}
            viewType="list" // Default to list view to match Mercado Livre style
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceScreen;
