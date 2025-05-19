
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
  
  // Debug logs to help track selected segments and their options
  console.log('[FilterChips] Rendering with selected segments:', selectedSegments);
  console.log('[FilterChips] Segment options:', segmentOptions);
  
  // Create a Set of displayed filter names to avoid duplicates
  const displayedFilterNames = new Set<string>();
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {selectedCategories.map(categoryId => {
        const category = allCategories.find(c => c.id === categoryId);
        const categoryLabel = category?.label || categoryId;
        
        // Skip if we already have a segment with the same name
        if (displayedFilterNames.has(categoryLabel)) {
          return null;
        }
        
        displayedFilterNames.add(categoryLabel);
        
        return (
          <Badge key={`category-${categoryId}`} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {categoryLabel}
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
        const lojaLabel = loja?.label || lojaId;
        
        // Skip if we already have a filter with the same name
        if (displayedFilterNames.has(lojaLabel)) {
          return null;
        }
        
        displayedFilterNames.add(lojaLabel);
        
        return (
          <Badge key={`loja-${lojaId}`} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {lojaLabel}
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
        const ratingLabel = rating?.label || ratingId;
        
        // Skip if we already have a filter with the same name
        if (displayedFilterNames.has(ratingLabel)) {
          return null;
        }
        
        displayedFilterNames.add(ratingLabel);
        
        return (
          <Badge key={`rating-${ratingId}`} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {ratingLabel}
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
        if (segmentId === "all") return null; // Skip the "all" segment filter chip
        
        // Find the corresponding segment option for this ID
        const segment = segmentOptions.find(s => s.id === segmentId);
        if (!segment) return null;
        
        const segmentLabel = segment.label;
        
        // Skip if we already have a filter with the same name displayed
        if (displayedFilterNames.has(segmentLabel)) {
          return null;
        }
        
        displayedFilterNames.add(segmentLabel);
        
        console.log('[FilterChips] Rendering segment chip:', segmentId, segment);
        
        return (
          <Badge key={`segment-${segmentId}`} variant="secondary" className="bg-white text-gray-800 flex items-center gap-1">
            {segmentLabel}
            <button 
              onClick={() => onSegmentClick(segmentId)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </Badge>
        );
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
