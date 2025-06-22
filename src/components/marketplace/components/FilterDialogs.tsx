
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FilterOption } from '@/hooks/use-product-filter';

interface FilterDialogsProps {
  lojasOptions: FilterOption[];
  allCategories: FilterOption[];
  segmentOptions?: FilterOption[];
  ratingOptions?: FilterOption[];
  priceRangeOptions?: FilterOption[];
  selectedLojas: string[];
  selectedCategories: string[];
  selectedSegments?: string[];
  selectedRatings?: string[];
  selectedPriceRanges?: string[];
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  onRatingClick?: (ratingId: string) => void;
  onPriceRangeClick?: (rangeId: string) => void;
}

const FilterDialogs: React.FC<FilterDialogsProps> = ({
  lojasOptions,
  allCategories,
  segmentOptions = [],
  priceRangeOptions = [],
  selectedLojas,
  selectedCategories,
  selectedSegments = [],
  selectedPriceRanges = [],
  onLojaClick,
  onCategoryClick,
  onSegmentClick = () => {},
  onPriceRangeClick = () => {}
}) => {
  console.log('[FilterDialogs] Rendering with lojas options:', lojasOptions);
  console.log('[FilterDialogs] Selected lojas:', selectedLojas);
  console.log('[FilterDialogs] Lojas options length:', lojasOptions.length);

  return (
    <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 sm:pb-4">
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap">
            Loja <ChevronDown size={14} className="sm:hidden" />
            <ChevronDown size={16} className="hidden sm:block" />
            {selectedLojas.length > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-construPro-orange text-white rounded-full px-1 text-xs">
                {selectedLojas.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Loja</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
            {lojasOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma loja disponível
              </div>
            ) : (
              lojasOptions.map(loja => {
                console.log('[FilterDialogs] Rendering loja:', loja);
                return (
                  <label key={loja.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={selectedLojas.includes(loja.id)} 
                      onChange={() => {
                        console.log('[FilterDialogs] Loja checkbox clicked:', loja.id, loja.label);
                        onLojaClick(loja.id);
                      }} 
                    />
                    {loja.label}
                  </label>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap">
            Categoria <ChevronDown size={14} className="sm:hidden" />
            <ChevronDown size={16} className="hidden sm:block" />
            {selectedCategories.length > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-construPro-orange text-white rounded-full px-1 text-xs">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Categoria</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
            {allCategories.map(category => (
              <label key={category.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  className="mr-2" 
                  checked={selectedCategories.includes(category.id)} 
                  onChange={() => onCategoryClick(category.id)} 
                />
                {category.label}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap">
            Preço <ChevronDown size={14} className="sm:hidden" />
            <ChevronDown size={16} className="hidden sm:block" />
            {selectedPriceRanges.length > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-construPro-orange text-white rounded-full px-1 text-xs">
                {selectedPriceRanges.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Preço</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
            {priceRangeOptions.map(option => (
              <label key={option.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  className="mr-2" 
                  checked={selectedPriceRanges.includes(option.id)}
                  onChange={() => {
                    console.log('[FilterDialogs] Price range clicked:', option.id);
                    onPriceRangeClick(option.id);
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap">
            Segmento <ChevronDown size={14} className="sm:hidden" />
            <ChevronDown size={16} className="hidden sm:block" />
            {selectedSegments.length > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-construPro-orange text-white rounded-full px-1 text-xs">
                {selectedSegments.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Segmento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
            {segmentOptions.map(segment => (
              <label key={segment.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  className="mr-2" 
                  checked={selectedSegments.includes(segment.id)} 
                  onChange={() => onSegmentClick(segment.id)} 
                />
                {segment.label}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilterDialogs;
