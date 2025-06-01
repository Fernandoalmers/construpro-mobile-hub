
import React, { useState } from 'react';
import MarketplaceScreenWrapper from './MarketplaceScreenWrapper';
import MarketplaceHeader from './MarketplaceHeader';
import SegmentCardsHeader from './components/SegmentCardsHeader';
import StoresSection from './components/StoresSection';
import ProductListSection from './ProductListSection';
import CartButton from './components/CartButton';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SearchResults from './components/SearchResults';

const MarketplaceScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  const marketplaceData = useMarketplaceData(searchQuery);

  if (!marketplaceData) {
    return <LoadingState text="Carregando marketplace..." />;
  }

  const { segments = [], categories = [], stores = [], products = [] } = marketplaceData;
  const loading = { segments: false, categories: false, stores: false, products: false };
  const error = { segments: null, categories: null, stores: null, products: null };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSegment('');
    setSelectedCategory('');
    setSelectedStore('');
    setPriceRange([0, 1000]);
    setSortBy('relevance');
  };

  const isFiltered = searchQuery || selectedSegment || selectedCategory || selectedStore || sortBy !== 'relevance';

  return (
    <MarketplaceScreenWrapper>
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        {/* Header com cor laranja escura */}
        <div className="bg-orange-600 py-6 px-4 shadow-lg">
          <MarketplaceHeader
            hideHeader={false}
            searchTerm={searchQuery}
            selectedCategories={selectedCategory ? [selectedCategory] : []}
            selectedLojas={selectedStore ? [selectedStore] : []}
            selectedRatings={[]}
            selectedSegments={selectedSegment ? [selectedSegment] : []}
            selectedPriceRanges={[]}
            allCategories={categories.map(cat => ({ id: cat.id || cat.nome, label: cat.nome }))}
            ratingOptions={[]}
            priceRangeOptions={[]}
            segmentOptions={segments.map(seg => ({ id: seg.id || seg.nome, label: seg.nome }))}
            stores={stores}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onSearch={(term) => setSearchQuery(term)}
            onLojaClick={setSelectedStore}
            onCategoryClick={setSelectedCategory}
            onRatingClick={() => {}}
            onSegmentClick={setSelectedSegment}
            onPriceRangeClick={() => {}}
            clearFilters={handleClearFilters}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {isFiltered ? (
            <SearchResults
              searchResults={products}
              showResults={true}
              onResultClick={(productId) => {
                window.location.href = `/produto/${productId}`;
              }}
            />
          ) : (
            <>
              <SegmentCardsHeader 
                selectedSegment={selectedSegment || null} 
                onSegmentClick={setSelectedSegment} 
              />
              <StoresSection 
                stores={stores} 
                onLojaClick={setSelectedStore}
                storesError={error.stores}
              />
              <ProductListSection
                displayedProducts={products}
                filteredProdutos={products}
                hasMore={false}
                loadMoreProducts={() => {}}
                clearFilters={handleClearFilters}
                onLojaClick={setSelectedStore}
                isLoading={loading.products}
                viewType={viewType}
              />
            </>
          )}
        </div>

        <CartButton />
      </div>
    </MarketplaceScreenWrapper>
  );
};

export default MarketplaceScreen;
