
import React, { useState } from 'react';
import GridProductView from './GridProductView';
import ListProductView from './ListProductView';
import LoadingState from '../../common/LoadingState';
import EmptyProductState from './EmptyProductState';
import DeliveryZoneIndicator from './DeliveryZoneIndicator';
import NoDeliveryZoneState from './NoDeliveryZoneState';
import SmartCepModal from './SmartCepModal';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters';
import { MapPin } from 'lucide-react';

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
  const { hasDefinedCepWithoutCoverage, clearAllFilters } = useMarketplaceFilters();
  const [showCepModal, setShowCepModal] = useState(false);

  // Handler para alterar CEP usando o modal inteligente
  const handleChangeCep = () => {
    setShowCepModal(true);
  };

  // Handler para quando CEP é alterado no modal
  const handleCepChange = async (newCep: string) => {
    await resolveZones(newCep);
  };

  // Determinar título baseado no estado da zona de entrega - SIMPLIFICADO
  const getPageTitle = () => {
    if (hasDefinedCepWithoutCoverage) {
      return "Nenhum lojista atende esse endereço";
    }
    
    return currentCategoryName || "Produtos disponíveis";
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

        {/* Título da página - SIMPLIFICADO */}
        {!hasDefinedCepWithoutCoverage && (
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800">
                  {getPageTitle()}
                </h2>
                {hasActiveZones && currentCep && (
                  <p className="text-xs text-gray-500 mt-1">
                    CEP {currentCep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                )}
              </div>
              
              {/* Botão Alterar CEP - AJUSTADO */}
              {!isLoading && currentCep && filteredProdutos.length > 0 && (
                <button
                  onClick={handleChangeCep}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-construPro-blue border border-construPro-blue rounded-md hover:bg-blue-50 transition-colors shrink-0"
                >
                  <MapPin className="w-3 h-3" />
                  Alterar CEP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <LoadingState type="skeleton" text="Carregando produtos..." count={6} />
        )}

        {/* Estado quando CEP definido mas sem vendedores que atendem */}
        {!isLoading && hasDefinedCepWithoutCoverage && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum lojista atende esse endereço
              </h3>
              <p className="text-gray-600 mb-6">
                Não encontramos vendedores que fazem entrega para o CEP {currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2')}. 
                Tente um CEP diferente.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleChangeCep}
                  className="w-full bg-construPro-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-construPro-blue-dark transition-colors"
                >
                  Alterar CEP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio padrão (sem CEP definido e sem produtos) */}
        {!isLoading && !hasDefinedCepWithoutCoverage && !currentCep && filteredProdutos.length === 0 && (
          <EmptyProductState 
            clearFilters={clearFilters}
          />
        )}

        {/* Lista de produtos */}
        {!isLoading && !hasDefinedCepWithoutCoverage && filteredProdutos.length > 0 && (
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

      {/* Modal Inteligente de Seleção de CEP */}
      <SmartCepModal
        open={showCepModal}
        onOpenChange={setShowCepModal}
        onCepChange={handleCepChange}
        currentCep={currentCep}
      />
    </div>
  );
};

export default MarketplaceContent;
