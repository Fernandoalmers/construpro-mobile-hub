
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../common/LoadingState';
import EmptyProductState from './EmptyProductState';
import EmptySegmentState from './EmptySegmentState';
import SmartCepModal from './SmartCepModal';
import PageTitleSection from './PageTitleSection';
import NoDeliveryState from './NoDeliveryState';
import ProductsDisplay from './ProductsDisplay';

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
  setSelectedSegmentId?: (id: string | null) => void;
  updateSegmentURL?: (id: string | null) => void;
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
  onLojaClick,
  setSelectedSegmentId,
  updateSegmentURL
}) => {
  const navigate = useNavigate();
  const { hasActiveZones, currentCep, resolveZones, isInitialized } = useDeliveryZones();
  const { hasDefinedCepWithoutCoverage } = useMarketplaceFilters();
  const [showCepModal, setShowCepModal] = useState(false);

  // Handler para alterar CEP usando o modal inteligente
  const handleChangeCep = () => {
    setShowCepModal(true);
  };

  // Handler para quando CEP é alterado no modal
  const handleCepChange = async (newCep: string) => {
    await resolveZones(newCep);
  };

  // Determinar se estamos em um segmento específico sem produtos
  const isSpecificSegmentWithoutProducts = () => {
    return currentCategoryName && 
           currentCategoryName !== "Todos os Produtos" && 
           currentCategoryName !== "Produtos disponíveis" &&
           filteredProdutos.length === 0 &&
           !hasDefinedCepWithoutCoverage;
  };

  // Handlers para o estado vazio de segmento
  const handleViewAllCategories = () => {
    if (setSelectedSegmentId) {
      setSelectedSegmentId(null);
    }
    if (updateSegmentURL) {
      updateSegmentURL(null);
    }
    clearFilters();
  };

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  // Determinar título baseado no estado atual
  const getPageTitle = () => {
    if (hasDefinedCepWithoutCoverage) {
      return "Nenhum lojista atende esse endereço";
    }
    
    return currentCategoryName || "Produtos disponíveis";
  };

  // Adicionar margem de segurança ao padding calculado
  const safePaddingTop = dynamicPaddingTop + 8;

  console.log('[MarketplaceContent] Padding aplicado:', {
    dynamicPaddingTop,
    safePaddingTop,
    currentCategoryName,
    isSpecificSegment: isSpecificSegmentWithoutProducts()
  });

  // Loading state coordenado - não mostra produtos até verificação completa
  if (isLoading || !isInitialized) {
    return (
      <div 
        className="flex-1 pb-20"
        style={{ paddingTop: `${safePaddingTop}px` }}
      >
        <div className="p-4">
          <LoadingState type="skeleton" text="Verificando produtos disponíveis..." count={6} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 pb-20"
      style={{ paddingTop: `${safePaddingTop}px` }}
    >
      <div className="p-4">
        {/* Título da página */}
        {!hasDefinedCepWithoutCoverage && !isSpecificSegmentWithoutProducts() && (
          <PageTitleSection
            title={getPageTitle()}
            currentCep={currentCep}
            hasActiveZones={hasActiveZones}
            onChangeCep={handleChangeCep}
            showProducts={filteredProdutos.length > 0}
          />
        )}

        {/* Estado específico para segmento sem produtos */}
        {isSpecificSegmentWithoutProducts() && (
          <EmptySegmentState
            segmentName={currentCategoryName}
            onViewAllCategories={handleViewAllCategories}
            onBackToHome={handleBackToHome}
          />
        )}

        {/* Estado quando CEP definido mas sem vendedores que atendem */}
        {hasDefinedCepWithoutCoverage && (
          <NoDeliveryState
            currentCep={currentCep}
            onChangeCep={handleChangeCep}
          />
        )}

        {/* Estado vazio padrão */}
        {!hasDefinedCepWithoutCoverage && !currentCep && filteredProdutos.length === 0 && !isSpecificSegmentWithoutProducts() && (
          <EmptyProductState 
            clearFilters={clearFilters}
          />
        )}

        {/* Lista de produtos */}
        {!hasDefinedCepWithoutCoverage && !isSpecificSegmentWithoutProducts() && filteredProdutos.length > 0 && (
          <ProductsDisplay
            viewType={viewType}
            products={filteredProdutos}
            displayedProducts={displayedProducts}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreProducts={loadMoreProducts}
            onLojaClick={onLojaClick}
          />
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
