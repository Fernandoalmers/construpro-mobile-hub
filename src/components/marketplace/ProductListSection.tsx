
import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; 

// Import our components
import ViewTypeSelector from './components/ViewTypeSelector';
import GridProductView from './components/GridProductView';
import ListProductView from './components/ListProductView';
import EmptyProductState from './components/EmptyProductState';
import ProductLoadingSkeleton from './components/ProductLoadingSkeleton';

interface ProductListSectionProps {
  displayedProducts: any[];
  filteredProdutos: any[];
  hasMore: boolean;
  isLoadingMore?: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  onLojaClick?: (lojaId: string) => void;
  isLoading?: boolean;
  viewType?: 'grid' | 'list';
  showActions?: boolean;
}

const LoadingIndicator = memo(({ loadMoreRef }: { loadMoreRef: React.RefObject<HTMLDivElement> }) => (
  <div 
    ref={loadMoreRef} 
    className="flex justify-center items-center p-4 mt-4"
  >
    <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
    <span className="ml-2 text-sm text-gray-500">Carregando mais produtos...</span>
  </div>
));

const ProductListSection: React.FC<ProductListSectionProps> = memo(({ 
  displayedProducts, 
  filteredProdutos, 
  hasMore, 
  isLoadingMore = false,
  loadMoreProducts,
  clearFilters,
  onLojaClick,
  isLoading = false,
  viewType: initialViewType = 'list',
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  // State for view type (grid or list)
  const [viewType, setViewType] = useState<'grid' | 'list'>(initialViewType);

  // Navigate to product details
  const navigateToProduct = useCallback((productId: string) => {
    navigate(`/produto/${productId}`);
  }, [navigate]);

  // Optimized intersection observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isNowIntersecting = entry.isIntersecting;
        
        setIsIntersecting(isNowIntersecting);
        
        if (isNowIntersecting && hasMore && !isLoadingMore) {
          console.log('[ProductListSection] Intersection detected - loading more products');
          loadMoreProducts();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading before reaching the exact bottom
      }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreProducts]);

  // Debug logging
  useEffect(() => {
    console.log('[ProductListSection] State:', {
      displayedProducts: displayedProducts.length,
      filteredTotal: filteredProdutos.length,
      hasMore,
      isLoadingMore,
      isIntersecting
    });
  }, [displayedProducts.length, filteredProdutos.length, hasMore, isLoadingMore, isIntersecting]);

  // Loading skeleton
  if (isLoading) {
    return <ProductLoadingSkeleton />;
  }

  // Empty state
  if (displayedProducts.length === 0) {
    return <EmptyProductState clearFilters={clearFilters} />;
  }

  return (
    <>
      {/* View type selector */}
      <ViewTypeSelector viewType={viewType} setViewType={setViewType} />
    
      {/* Products display */}
      {viewType === 'grid' ? (
        <GridProductView 
          products={displayedProducts} 
          navigateToProduct={navigateToProduct}
          onLojaClick={onLojaClick}
        />
      ) : (
        <ListProductView 
          products={displayedProducts} 
          navigateToProduct={navigateToProduct}
          onLojaClick={onLojaClick}
        />
      )}
      
      {/* Infinite scroll loading indicator - only show when there are more products */}
      {hasMore && (
        <LoadingIndicator loadMoreRef={loadMoreRef} />
      )}
      
      {/* End of list indicator */}
      {!hasMore && displayedProducts.length > 0 && (
        <div className="text-center p-4 text-gray-500 text-sm">
          Todos os produtos foram carregados
        </div>
      )}
    </>
  );
});

ProductListSection.displayName = 'ProductListSection';

export default ProductListSection;
