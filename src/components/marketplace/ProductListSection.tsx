
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Grid, List, Star, ShoppingCart, Plus } from 'lucide-react';
import ProdutoCard from './ProdutoCard';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/components/ui/sonner';

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
  viewType: initialViewType = 'grid'
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);
  const { addToCart } = useCart();
  
  // State for view type (grid or list)
  const [viewType, setViewType] = useState<'grid' | 'list'>(initialViewType);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

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

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
      toast.success('Produto adicionado ao carrinho');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className={viewType === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-3'}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={`bg-white rounded-md shadow-sm ${viewType === 'grid' ? 'animate-pulse' : 'p-3 flex animate-pulse'}`}>
            {viewType === 'grid' ? (
              <div className="flex flex-col">
                <div className="h-40 bg-gray-200 rounded-t-md"></div>
                <div className="p-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 bg-gray-200 rounded-md mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </>
            )}
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
              onAddToCart={(e) => handleAddToCart(e, produto.id)}
              isAddingToCart={addingToCart[produto.id]}
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
              <div className="w-24 h-24 rounded-md overflow-hidden mr-3 flex-shrink-0">
                <img 
                  src={produto.imagemUrl || produto.imagem_url} 
                  alt={produto.nome}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1">
                {/* Store name */}
                {produto.stores && (
                  <div 
                    className="text-xs text-gray-500 mb-1 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLojaClick && onLojaClick(produto.stores.id);
                    }}
                  >
                    {produto.stores.nome}
                  </div>
                )}
                
                {/* Product name */}
                <h3 className="text-sm font-medium line-clamp-2">{produto.nome}</h3>
                
                {/* Rating */}
                <div className="flex items-center mt-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs ml-1">{produto.avaliacao || 0}</span>
                </div>
                
                {/* Price */}
                <div className="mt-1">
                  <span className="text-sm font-bold">R$ {(produto.preco || 0).toFixed(2)}</span>
                  {(produto.precoAnterior > produto.preco || produto.preco_anterior > produto.preco) && (
                    <span className="text-xs text-gray-400 line-through ml-2">
                      R$ {((produto.precoAnterior || produto.preco_anterior) || 0).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Points */}
                {(produto.pontos > 0 || produto.pontos_consumidor > 0) && (
                  <div className="text-xs text-construPro-orange mt-1">
                    Ganhe {produto.pontos || produto.pontos_consumidor} pontos
                  </div>
                )}
              </div>
              
              {/* Add to cart button */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300"
                  onClick={(e) => handleAddToCart(e, produto.id)}
                  disabled={addingToCart[produto.id]}
                >
                  {addingToCart[produto.id] ? (
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
                  ) : (
                    <Plus size={18} className="text-green-600" />
                  )}
                </Button>
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
