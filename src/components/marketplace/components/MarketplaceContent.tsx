
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

  // Determinar título baseado no estado da zona de entrega
  const getPageTitle = () => {
    if (hasDefinedCepWithoutCoverage) {
      return "Nenhum lojista atende esse endereço";
    }
    
    if (hasActiveZones && currentCep) {
      return "Produtos disponíveis para o endereço selecionado";
    }
    
    if (!currentCep) {
      return "Todos os produtos disponíveis";
    }
    
    return currentCategoryName;
  };

  // Determinar subtítulo com informações da zona
  const getSubtitle = () => {
    if (hasDefinedCepWithoutCoverage) {
      return `Não encontramos vendedores para o CEP ${currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2')}`;
    }
    
    const productCount = filteredProdutos.length;
    const productText = `${productCount} produto${productCount !== 1 ? 's' : ''} encontrado${productCount !== 1 ? 's' : ''}`;
    
    if (hasActiveZones && currentCep) {
      return `${productText} para o CEP ${currentCep.replace(/(\d{5})(\d{3})/, '$1-$2')}`;
    }
    
    return productText;
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

        {/* Título da página */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {getPageTitle()}
          </h2>
          <p className="text-sm text-gray-600">
            {getSubtitle()}
          </p>
          {hasActiveZones && !hasDefinedCepWithoutCoverage && (
            <p className="text-xs text-construPro-blue mt-1">
              Mostrando apenas produtos com entrega disponível
            </p>
          )}
        </div>

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
                Tente um CEP diferente ou navegue pelos produtos sem filtro de região.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleChangeCep}
                  className="w-full bg-construPro-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-construPro-blue-dark transition-colors"
                >
                  Alterar CEP
                </button>
                <button
                  onClick={() => {
                    // Limpar CEP para mostrar todos os produtos
                    if (clearAllFilters) {
                      clearAllFilters();
                    }
                  }}
                  className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Ver todos os produtos
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
