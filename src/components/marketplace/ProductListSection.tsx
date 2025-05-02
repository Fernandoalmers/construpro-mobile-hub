
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import lojas from '../../data/lojas.json';
import ProdutoCard from './ProdutoCard';

interface ProductListSectionProps {
  displayedProducts: any[];
  filteredProdutos: any[];
  hasMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  onLojaClick?: (lojaId: string) => void;
}

const ProductListSection: React.FC<ProductListSectionProps> = ({ 
  displayedProducts, 
  filteredProdutos, 
  hasMore, 
  loadMoreProducts,
  clearFilters,
  onLojaClick 
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

  if (displayedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingBag size={48} className="text-gray-400 mb-4" />
        <h3 className="font-bold text-xl mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-500 text-center mb-6">Tente mudar os filtros ou buscar por outro termo.</p>
        <button 
          className="bg-construPro-blue text-white px-4 py-2 rounded-md"
          onClick={clearFilters}
        >
          Limpar filtros
        </button>
      </div>
    );
  }

  return (
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
              onLojaClick={onLojaClick}
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
  );
};

export default ProductListSection;
