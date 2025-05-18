
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FilterOption } from '@/hooks/use-product-filter';

interface FilterDialogsProps {
  lojasOptions: FilterOption[];
  allCategories: FilterOption[];
  segmentOptions?: FilterOption[];
  ratingOptions?: FilterOption[];
  selectedLojas: string[];
  selectedCategories: string[];
  selectedSegments?: string[];
  selectedRatings?: string[];
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  onRatingClick?: (ratingId: string) => void;
}

const FilterDialogs: React.FC<FilterDialogsProps> = ({
  lojasOptions,
  allCategories,
  segmentOptions = [],
  selectedLojas,
  selectedCategories,
  selectedSegments = [],
  onLojaClick,
  onCategoryClick,
  onSegmentClick = () => {}
}) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-4">
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
            Loja <ChevronDown size={16} />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Loja</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
            {lojasOptions.map(loja => (
              <label key={loja.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox"
                  className="mr-2" 
                  checked={selectedLojas.includes(loja.id)} 
                  onChange={() => onLojaClick(loja.id)}
                />
                {loja.label}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
            Categoria <ChevronDown size={16} />
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
      
      {/* Price filter */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
            Preço <ChevronDown size={16} />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Preço</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="flex flex-col space-y-4">
              {[
                { id: 'preco-1', label: 'Até R$ 50' },
                { id: 'preco-2', label: 'R$ 50 a R$ 100' },
                { id: 'preco-3', label: 'R$ 100 a R$ 200' },
                { id: 'preco-4', label: 'R$ 200 a R$ 500' },
                { id: 'preco-5', label: 'Acima de R$ 500' }
              ].map(option => (
                <label key={option.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox"
                    className="mr-2" 
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Segment filter - Added as requested */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
            Segmento <ChevronDown size={16} />
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
