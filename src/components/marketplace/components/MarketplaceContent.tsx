
import React from 'react';
import StoresSection from './StoresSection';
import CategoryHeader from './CategoryHeader';
import ProductListSection from '../ProductListSection';
import ProdutoCard from '../ProdutoCard';

interface MarketplaceContentProps {
  dynamicPaddingTop: number;
  stores: any[];
  onLojaClick: (lojaId: string) => void;
  storesError: string | null;
  currentCategoryName: string;
  filteredProdutos: any[];
  isLoading: boolean;
  displayedProducts: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
}

const MarketplaceContent: React.FC<MarketplaceContentProps> = ({
  dynamicPaddingTop,
  stores,
  onLojaClick,
  storesError,
  currentCategoryName,
  filteredProdutos,
  isLoading,
  displayedProducts,
  hasMore,
  isLoadingMore,
  loadMoreProducts,
  clearFilters
}) => {
  // Ensure arrays are safe to use
  const safeStores = Array.isArray(stores) ? stores : [];
  const safeFilteredProducts = Array.isArray(filteredProdutos) ? filteredProdutos : [];
  const safeDisplayedProducts = Array.isArray(displayedProducts) ? displayedProducts : [];

  return (
    <main 
      className="flex-1 overflow-y-auto"
      style={{ paddingTop: `${dynamicPaddingTop}px` }}
    >
      <div className="min-h-screen">
        {/* Stores Section */}
        <StoresSection 
          stores={safeStores}
          onLojaClick={onLojaClick}
          storesError={storesError}
        />
        
        {/* Category Header */}
        <CategoryHeader 
          currentCategoryName={currentCategoryName}
          productCount={safeFilteredProducts.length}
        />
        
        {/* Products Section using ProdutoCard for original layout */}
        <div className="bg-white min-h-screen">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando produtos...</p>
              </div>
            </div>
          ) : safeFilteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600 mb-6">Tente ajustar seus filtros ou buscar por outros termos</p>
                <button
                  onClick={clearFilters}
                  className="bg-construPro-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Products Grid using original ProdutoCard */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {safeDisplayedProducts.map((produto) => (
                  <ProdutoCard
                    key={produto?.id || Math.random()}
                    produto={produto}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && safeDisplayedProducts.length > 0 && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={loadMoreProducts}
                    disabled={isLoadingMore}
                    className="bg-construPro-blue text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    {isLoadingMore ? 'Carregando...' : 'Carregar mais produtos'}
                  </button>
                </div>
              )}

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-4">
                  <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-sm text-gray-500">Carregando mais produtos...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default MarketplaceContent;
