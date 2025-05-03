
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import ProdutoCard from './ProdutoCard';
import { Button } from '@/components/ui/button';

interface ProductListSectionProps {
  displayedProducts: any[];
  filteredProdutos: any[];
  hasMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  onLojaClick?: (lojaId: string) => void;
  isLoading?: boolean;
}

const ProductListSection: React.FC<ProductListSectionProps> = ({ 
  displayedProducts, 
  filteredProdutos, 
  hasMore, 
  loadMoreProducts,
  clearFilters,
  onLojaClick,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);

  // Set up intersection observer for infinite scroll
  React.useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-md shadow-sm p-3 flex animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-md mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingBag size={48} className="text-gray-400 mb-4" />
        <h3 className="font-bold text-xl mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-500 text-center mb-6">Tente mudar os filtros ou buscar por outro termo.</p>
        <Button 
          className="bg-construPro-blue text-white px-4 py-2 rounded-md"
          onClick={clearFilters}
        >
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {displayedProducts.map(produto => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            loja={produto.stores}
            onClick={() => navigate(`/produto/${produto.id}`)}
            onLojaClick={onLojaClick}
          />
        ))}
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
  );
};

export default ProductListSection;
