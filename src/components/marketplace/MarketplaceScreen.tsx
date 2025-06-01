
import React, { useState } from 'react';
import { MarketplaceScreenWrapper } from './MarketplaceScreenWrapper';
import { MarketplaceHeader } from './MarketplaceHeader';
import { SegmentCardsHeader } from './components/SegmentCardsHeader';
import { StoresSection } from './components/StoresSection';
import { ProductListSection } from './ProductListSection';
import { CartButton } from './components/CartButton';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { SearchResults } from './components/SearchResults';

const MarketplaceScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  const {
    segments,
    categories,
    stores,
    products,
    loading,
    error
  } = useMarketplaceData({
    searchQuery,
    selectedSegment,
    selectedCategory,
    selectedStore,
    priceRange,
    sortBy
  });

  if (loading.segments || loading.categories || loading.stores) {
    return <LoadingState message="Carregando marketplace..." />;
  }

  if (error.segments || error.categories || error.stores) {
    return <ErrorState message="Erro ao carregar marketplace" />;
  }

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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSegment={selectedSegment}
            onSegmentChange={setSelectedSegment}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewType={viewType}
            onViewTypeChange={setViewType}
            segments={segments}
            categories={categories}
            stores={stores}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {isFiltered ? (
            <SearchResults
              searchQuery={searchQuery}
              selectedSegment={selectedSegment}
              selectedCategory={selectedCategory}
              selectedStore={selectedStore}
              priceRange={priceRange}
              sortBy={sortBy}
              viewType={viewType}
              onClearFilters={handleClearFilters}
              segments={segments}
              categories={categories}
              stores={stores}
              products={products}
              loading={loading.products}
              error={error.products}
            />
          ) : (
            <>
              <SegmentCardsHeader segments={segments} onSegmentSelect={setSelectedSegment} />
              <StoresSection stores={stores} onStoreSelect={setSelectedStore} />
              <ProductListSection
                products={products}
                loading={loading.products}
                error={error.products}
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
