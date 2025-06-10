
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FilterOption } from '@/hooks/use-product-filter';

interface FilterChipsProps {
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments: string[];
  selectedPriceRanges?: string[];
  allCategories: FilterOption[];
  lojasOptions: FilterOption[];
  ratingOptions: FilterOption[];
  priceRangeOptions?: FilterOption[];
  segmentOptions: FilterOption[];
  onCategoryClick: (categoryId: string) => void;
  onLojaClick: (lojaId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onPriceRangeClick?: (rangeId: string) => void;
  clearFilters: () => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments,
  selectedPriceRanges = [],
  allCategories,
  lojasOptions,
  ratingOptions,
  priceRangeOptions = [],
  segmentOptions,
  onCategoryClick,
  onLojaClick,
  onRatingClick,
  onSegmentClick,
  onPriceRangeClick = () => {},
  clearFilters
}) => {
  const hasFilters = selectedCategories.length > 0 || 
                   selectedLojas.length > 0 || 
                   selectedRatings.length > 0 || 
                   selectedSegments.length > 0 ||
                   selectedPriceRanges.length > 0;

  if (!hasFilters) return null;

  return (
    <motion.div 
      className="flex flex-wrap gap-2 mt-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Category chips */}
      {selectedCategories.map(categoryId => {
        const category = allCategories.find(cat => cat.id === categoryId);
        return (
          <motion.div
            key={`category-${categoryId}`}
            className="flex items-center bg-white/20 text-white px-2 py-1 rounded-full text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span>Cat: {category?.label}</span>
            <button
              onClick={() => onCategoryClick(categoryId)}
              className="ml-1 hover:bg-white/30 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        );
      })}

      {/* Store chips */}
      {selectedLojas.map(lojaId => {
        const loja = lojasOptions.find(loja => loja.id === lojaId);
        return (
          <motion.div
            key={`loja-${lojaId}`}
            className="flex items-center bg-white/20 text-white px-2 py-1 rounded-full text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span>Loja: {loja?.label}</span>
            <button
              onClick={() => onLojaClick(lojaId)}
              className="ml-1 hover:bg-white/30 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        );
      })}

      {/* Price range chips */}
      {selectedPriceRanges.map(rangeId => {
        const range = priceRangeOptions.find(range => range.id === rangeId);
        return (
          <motion.div
            key={`price-${rangeId}`}
            className="flex items-center bg-white/20 text-white px-2 py-1 rounded-full text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span>Preço: {range?.label}</span>
            <button
              onClick={() => onPriceRangeClick(rangeId)}
              className="ml-1 hover:bg-white/30 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        );
      })}

      {/* Rating chips */}
      {selectedRatings.map(ratingId => {
        const rating = ratingOptions.find(r => r.id === ratingId);
        return (
          <motion.div
            key={`rating-${ratingId}`}
            className="flex items-center bg-white/20 text-white px-2 py-1 rounded-full text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span>Nota: {rating?.label}</span>
            <button
              onClick={() => onRatingClick(ratingId)}
              className="ml-1 hover:bg-white/30 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        );
      })}

      {/* Segment chips */}
      {selectedSegments.map(segmentId => {
        const segment = segmentOptions.find(seg => seg.id === segmentId);
        return (
          <motion.div
            key={`segment-${segmentId}`}
            className="flex items-center bg-white/20 text-white px-2 py-1 rounded-full text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span>Seg: {segment?.label}</span>
            <button
              onClick={() => onSegmentClick(segmentId)}
              className="ml-1 hover:bg-white/30 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        );
      })}

      {/* Clear all filters button */}
      <motion.button
        onClick={clearFilters}
        className="flex items-center bg-construPro-orange text-white px-2 py-1 rounded-full text-xs hover:bg-construPro-orange/80"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        Limpar tudo <X size={12} className="ml-1" />
      </motion.button>
    </motion.div>
  );
};

export default FilterChips;
