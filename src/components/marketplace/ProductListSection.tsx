
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; 

// Import our new components
import ViewTypeSelector from './components/ViewTypeSelector';
import GridProductView from './components/GridProductView';
import ListProductView from './components/ListProductView';
import EmptyProductState from './components/EmptyProductState';
import ProductLoadingSkeleton from './components/ProductLoadingSkeleton';
import LoadingIndicator from './components/LoadingIndicator';

interface ProductListSectionProps {
  displayedProducts: any[];
  filteredProdutos: any[];
  hasMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  onLojaClick?: (lojaId: string) => void;
  isLoading?: boolean;
  viewType?: 'grid' | 'list';
}

const ProductListSection: React.FC<ProductListSectionProps> = ({ 
  displayedProducts, 
  filteredProdutos, 
  hasMore, 
  loadMoreProducts,
  clearFilters,
  onLojaClick,
  isLoading = false,
  viewType: initialViewType = 'list' // Default to list view
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);
  const { isAuthenticated } = useAuth();
  
  // State for view type (grid or list)
  const [viewType, setViewType] = useState<'grid' | 'list'>(initialViewType);

  // Navigate to product details
  const navigateToProduct = (productId: string) => {
    navigate(`/produto/${productId}`);
  };

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
  }, [loadMoreRef, hasMore, loadMoreProducts]);

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
      
      {/* Infinite scroll loading indicator */}
      {hasMore && <LoadingIndicator loadMoreRef={loadMoreRef} />}
    </>
  );
};

export default ProductListSection;
