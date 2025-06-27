
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { FilterOption } from '@/hooks/use-product-filter';
import SmartCepModal from './components/SmartCepModal';

// Import our components
import MarketplaceHeaderTop from './components/MarketplaceHeaderTop';
import SearchBar from './components/SearchBar';
import FilterDialogs from './components/FilterDialogs';
import FilterChips from './components/FilterChips';
import SegmentCardsHeader from './components/SegmentCardsHeader';

interface MarketplaceHeaderProps {
  hideHeader: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  selectedPriceRanges?: string[];
  selectedSegmentId?: string | null;
  viewType?: 'grid' | 'list';
  setViewType?: (type: 'grid' | 'list') => void;
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  priceRangeOptions?: FilterOption[];
  segmentOptions?: FilterOption[];
  stores?: any[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  onPriceRangeClick?: (rangeId: string) => void;
  clearFilters: () => void;
  onHeightChange?: (height: number) => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  selectedPriceRanges = [],
  selectedSegmentId,
  viewType = 'grid',
  setViewType = () => {},
  allCategories,
  ratingOptions,
  priceRangeOptions = [],
  segmentOptions = [],
  stores = [],
  onSearchChange,
  onSearch,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSegmentClick = () => {},
  onPriceRangeClick = () => {},
  clearFilters,
  onHeightChange
}) => {
  const { cartCount } = useCart();
  const { currentCep, resolveZones } = useDeliveryZones();
  const [showCepModal, setShowCepModal] = useState(false);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);

  // Handler para alterar CEP usando o modal inteligente
  const handleChangeCep = () => {
    setShowCepModal(true);
  };

  // Handler para quando CEP é alterado no modal
  const handleCepChange = async (newCep: string) => {
    await resolveZones(newCep);
  };

  // Calculate and report only the always-visible section height
  useEffect(() => {
    const calculateHeight = () => {
      if (topSectionRef.current && onHeightChange) {
        const height = topSectionRef.current.offsetHeight;
        onHeightChange(height);
      }
    };

    // Calculate height immediately and after DOM updates
    const timeoutId = setTimeout(calculateHeight, 0);
    calculateHeight();
    
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timeoutId);
    };
  }, [onHeightChange]);

  // Fix the store mapping to ensure proper format
  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome_loja || store.nome || 'Loja sem nome'
  }));

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Seção Superior - SEMPRE VISÍVEL (Busca + Navegação) */}
        <div 
          ref={topSectionRef}
          className="bg-construPro-blue relative z-50"
        >
          <div className="p-2 sm:p-4 pt-4 sm:pt-8">
            {/* Header Top with Back Button, Title, CEP Button, View Selector and Cart */}
            <MarketplaceHeaderTop 
              cartCount={cartCount} 
              viewType={viewType}
              setViewType={setViewType}
              currentCep={currentCep}
              onChangeCep={handleChangeCep}
            />
            
            {/* Search Bar - SEMPRE VISÍVEL */}
            <div className="mt-1.5 sm:mt-3">
              <SearchBar 
                searchTerm={searchTerm} 
                onSearchChange={onSearchChange} 
                onSearch={onSearch} 
                showSuggestions={false} 
              />
            </div>
          </div>
        </div>

        {/* Seção Inferior - OCULTÁVEL (Filtros) */}
        <motion.div 
          ref={bottomSectionRef}
          className="bg-construPro-blue relative z-40 overflow-hidden"
          initial={{ maxHeight: '500px' }}
          animate={{ 
            maxHeight: hideHeader ? '0px' : '500px'
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart for smoother animation
          }}
        >
          <div className="p-2 sm:p-4 pt-0">
            {/* Filter Dialogs */}
            <FilterDialogs 
              lojasOptions={lojasOptions} 
              allCategories={allCategories} 
              segmentOptions={segmentOptions} 
              priceRangeOptions={priceRangeOptions} 
              selectedLojas={selectedLojas} 
              selectedCategories={selectedCategories} 
              selectedSegments={selectedSegments} 
              selectedPriceRanges={selectedPriceRanges} 
              onLojaClick={onLojaClick} 
              onCategoryClick={onCategoryClick} 
              onSegmentClick={onSegmentClick} 
              onPriceRangeClick={onPriceRangeClick} 
            />
            
            {/* Selected Filter Chips */}
            <FilterChips 
              selectedCategories={selectedCategories} 
              selectedLojas={selectedLojas} 
              selectedRatings={selectedRatings} 
              selectedSegments={selectedSegments} 
              selectedPriceRanges={selectedPriceRanges} 
              allCategories={allCategories} 
              lojasOptions={lojasOptions} 
              ratingOptions={ratingOptions} 
              priceRangeOptions={priceRangeOptions} 
              segmentOptions={segmentOptions} 
              onCategoryClick={onCategoryClick} 
              onLojaClick={onLojaClick} 
              onRatingClick={onRatingClick} 
              onSegmentClick={onSegmentClick} 
              onPriceRangeClick={onPriceRangeClick} 
              clearFilters={clearFilters} 
            />
          </div>
          
          {/* Segment Cards Header - now hidden but logic preserved */}
          <div className="bg-white">
            <SegmentCardsHeader 
              selectedSegment={selectedSegmentId}
              onSegmentClick={onSegmentClick}
              showSegmentCards={false}
            />
          </div>
        </motion.div>
      </div>

      {/* Modal Inteligente de Seleção de CEP */}
      <SmartCepModal
        open={showCepModal}
        onOpenChange={setShowCepModal}
        onCepChange={handleCepChange}
        currentCep={currentCep}
      />
    </>
  );
};

export default MarketplaceHeader;
