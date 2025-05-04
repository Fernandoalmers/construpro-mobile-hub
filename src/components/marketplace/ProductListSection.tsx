
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Grid, List } from 'lucide-react';
import ProdutoCard from './ProdutoCard';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/context/AuthContext'; 
import ProductActions from './components/ProductActions';

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
  viewType: initialViewType = 'list' // Default to list view now
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);
  const { isAuthenticated } = useAuth();
  
  // State for view type (grid or list)
  const [viewType, setViewType] = React.useState<'grid' | 'list'>(initialViewType);

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
        {[...Array(8)].map((_, index) => (
          <div key={index} className="p-3 flex animate-pulse bg-white rounded-md shadow-sm">
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
      {/* View type selector */}
      <div className="flex justify-end mb-3">
        <div className="bg-white rounded-md border border-gray-200 inline-flex">
          <button 
            className={`p-1.5 ${viewType === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
            onClick={() => setViewType('grid')}
            title="Visualização em grade"
          >
            <Grid size={18} />
          </button>
          <button 
            className={`p-1.5 ${viewType === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
            onClick={() => setViewType('list')}
            title="Visualização em lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>
    
      {/* Products display */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayedProducts.map(produto => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              loja={produto.stores}
              onClick={() => navigate(`/produto/${produto.id}`)}
              onLojaClick={onLojaClick}
              onAddToCart={undefined} 
              onAddToFavorites={undefined}
              isAddingToCart={false}
              isFavorite={false}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayedProducts.map(produto => (
            <div 
              key={produto.id} 
              className="bg-white rounded-md shadow-sm p-3 flex border border-gray-100 relative"
              onClick={() => navigate(`/produto/${produto.id}`)}
            >
              {/* Product Image - positioned on the left side */}
              <div className="w-20 h-20 rounded-md overflow-hidden mr-3 flex-shrink-0">
                <img 
                  src={produto.imagemUrl || produto.imagem_url} 
                  alt={produto.nome}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1">
                {/* Product name */}
                <h3 className="text-sm font-medium line-clamp-2 mb-1">{produto.nome}</h3>
                
                {/* Type/Category */}
                <div className="text-xs text-gray-500 mb-1">
                  {produto.categoria || "Acrílica"}
                </div>
                
                {/* Rating */}
                <div className="flex items-center mb-1">
                  <div className="flex text-amber-400">
                    {"★".repeat(Math.round(produto.avaliacao || 4.5))}
                  </div>
                  <span className="text-xs ml-1">
                    ({produto.avaliacoes_count || Math.floor(Math.random() * 100) + 50})
                  </span>
                </div>
                
                {/* Price section */}
                <div className="font-bold text-lg">
                  R$ {(produto.preco || 99.90).toFixed(2).replace('.', ',')}
                </div>

                {/* Store name */}
                {produto.stores && (
                  <div 
                    className="text-xs text-gray-500 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLojaClick && onLojaClick(produto.stores.id);
                    }}
                  >
                    Vendido por {produto.stores.nome}
                  </div>
                )}
                
                {/* Free shipping */}
                <div className="text-xs text-green-600 mt-1">
                  Entrega GRÁTIS
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
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
