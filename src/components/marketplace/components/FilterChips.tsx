
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FilterOption } from '@/hooks/use-product-filter';

interface FilterChipsProps {
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  allCategories: FilterOption[];
  lojasOptions: FilterOption[];
  ratingOptions: FilterOption[];
  segmentOptions?: FilterOption[];
  onCategoryClick: (categoryId: string) => void;
  onLojaClick: (lojaId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  clearFilters: () => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  allCategories,
  lojasOptions,
  ratingOptions,
  segmentOptions = [],
  onCategoryClick,
  onLojaClick,
  onRatingClick,
  onSegmentClick = () => {},
  clearFilters
}) => {
  // Only show the clear filters button if ANY filter is applied
  const hasAnyFilter = selectedCategories.length > 0 || 
                       selectedLojas.length > 0 || 
                       selectedRatings.length > 0 || 
                       selectedSegments.length > 0;
                       
  if (!hasAnyFilter) {
    return null;
  }
  
  // Add log to debug segment filter chips
  console.log('[FilterChips] Rendering with selected segments:', selectedSegments);
  console.log('[FilterChips] Segment options:', segmentOptions);
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {selectedCategories.map(categoryId => {
        const category = allCategories.find(c => c.id === categoryId);
        return (
          <Badge key={categoryId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {category?.label}
            <button 
              onClick={() => onCategoryClick(categoryId)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </Badge>
        );
      })}
      
      {selectedLojas.map(lojaId => {
        const loja = lojasOptions.find(l => l.id === lojaId);
        return (
          <Badge key={lojaId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {loja?.label}
            <button 
              onClick={() => onLojaClick(lojaId)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </Badge>
        );
      })}
      
      {selectedRatings.map(ratingId => {
        const rating = ratingOptions.find(r => r.id === ratingId);
        return (
          <Badge key={ratingId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {rating?.label}
            <button 
              onClick={() => onRatingClick(ratingId)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </Badge>
        );
      })}
      
      {selectedSegments.map(segmentId => {
        const segment = segmentOptions.find(s => s.id === segmentId);
        console.log('[FilterChips] Rendering segment chip:', segmentId, segment);
        return segment ? (
          <Badge key={segmentId} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {segment.label}
            <button 
              onClick={() => onSegmentClick(segmentId)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </Badge>
        ) : null;
      })}
      
      {hasAnyFilter && (
        <button 
          onClick={clearFilters}
          className="text-white text-sm underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
};

export default FilterChips;
