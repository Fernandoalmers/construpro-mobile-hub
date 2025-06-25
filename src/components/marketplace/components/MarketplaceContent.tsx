
import React from 'react';
import GridProductView from './GridProductView';
import ListProductView from './ListProductView';
import LoadingState from '../../common/LoadingState';
import EmptyProductState from './EmptyProductState';
import DeliveryZoneIndicator from './DeliveryZoneIndicator';
import NoDeliveryZoneState from './NoDeliveryZoneState';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';

interface MarketplaceContentProps {
  dynamicPaddingTop: number;
  currentCategoryName: string;
  filteredProdutos: any[];
  isLoading: boolean;
  displayedProducts: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  viewType: 'grid' | 'list';
  onLojaClick?: (lojaId: string) => void;
}

const MarketplaceContent: React.FC<MarketplaceContentProps> = ({
  dynamicPaddingTop,
  currentCategoryName,
  filteredProdutos,
  isLoading,
  displayedProducts,
  hasMore,
  isLoadingMore,
  loadMoreProducts,
  clearFilters,
  viewType,
  onLojaClick
}) => {
  const { hasActiveZones, currentCep, resolveZones } = useDeliveryZones();

  // Handler para trocar CEP
  const handleChangeCep = () => {
    // Aqui você pode abrir um modal ou navegar para uma tela de seleção de CEP
    const newCep = prompt('Digite o novo CEP:');
    if (newCep) {
      resolveZones(newCep);
    }
  };

  // Handler para tentar novamente
  const handleRetry = () => {
    if (currentCep) {
      resolveZones(currentCep);
    }
  };

  return (
    <div 
      className="flex-1 pb-20"
      style={{ paddingTop: `${dynamicPaddingTop}px` }}
    >
      <div className="p-4">
        {/* Indicador de zona de entrega */}
        <div className="mb-4">
          <DeliveryZoneIndicator />
        </div>

        {/* Nome da categoria atual */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {currentCategoryName}
          </h2>
          <p className="text-sm text-gray-600">
            {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? 's' : ''} encontrado{filteredProdutos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <LoadingState type="skeleton" text="Carregando produtos..." count={6} />
        )}

        {/* Estado quando não há produtos na zona de entrega */}
        {!isLoading && hasActiveZones && filteredProdutos.length === 0 && (
          <NoDeliveryZoneState
            currentCep={currentCep}
            onChangeCep={handleChangeCep}
            onRetry={handleRetry}
          />
        )}

        {/* Estado vazio padrão (sem filtros de zona) */}
        {!isLoading && !hasActiveZones && filteredProdutos.length === 0 && (
          <EmptyProductState 
            clearFilters={clearFilters}
          />
        )}

        {/* Lista de produtos */}
        {!isLoading && filteredProdutos.length > 0 && (
          <>
            {viewType === 'grid' ? (
              <GridProductView
                products={displayedProducts}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={loadMoreProducts}
                onLojaClick={onLojaClick}
              />
            ) : (
              <ListProductView
                products={displayedProducts}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={loadMoreProducts}
                onLojaClick={onLojaClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketplaceContent;
