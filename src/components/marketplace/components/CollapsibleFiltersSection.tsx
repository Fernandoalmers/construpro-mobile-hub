
import React from 'react';
import { motion } from 'framer-motion';
import { FilterOption } from '@/hooks/use-product-filter';
import FilterDialogs from './FilterDialogs';
import FilterChips from './FilterChips';
import SegmentCardsHeader from './SegmentCardsHeader';

interface CollapsibleFiltersSectionProps {
  hideFilters: boolean;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments: string[];
  selectedPriceRanges: string[];
  selectedSegmentId?: string | null;
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  priceRangeOptions: FilterOption[];
  segmentOptions: FilterOption[];
  lojasOptions: FilterOption[];
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onPriceRangeClick: (rangeId: string) => void;
  clearFilters: () => void;
}

const CollapsibleFiltersSection: React.FC<CollapsibleFiltersSectionProps> = ({
  hideFilters,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments,
  selectedPriceRanges,
  selectedSegmentId,
  allCategories,
  ratingOptions,
  priceRangeOptions,
  segmentOptions,
  lojasOptions,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSegmentClick,
  onPriceRangeClick,
  clearFilters
}) => {
  return (
    <motion.div 
      className="bg-construPro-blue"
      initial={{ transform: 'translateY(0)' }}
      animate={{ 
        transform: hideFilters ? 'translateY(-100%)' : 'translateY(0)'
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
  );
};

export default CollapsibleFiltersSection;
