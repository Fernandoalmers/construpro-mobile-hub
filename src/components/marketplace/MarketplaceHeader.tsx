
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import CustomInput from '../common/CustomInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { FilterOption } from '@/hooks/use-product-filter';
import lojas from '../../data/lojas.json';

interface MarketplaceHeaderProps {
  hideHeader: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  clearFilters: () => void;
}

const lojasOptions: FilterOption[] = lojas.map(loja => ({
  id: loja.id,
  label: loja.nome
}));

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  allCategories,
  ratingOptions,
  onSearchChange,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  clearFilters
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/marketplace');
  };

  return (
    <motion.div 
      className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm"
      initial={{ translateY: 0 }}
      animate={{ 
        translateY: hideHeader ? '-100%' : 0,
        opacity: hideHeader ? 0 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-construPro-blue p-4 pt-8">
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBackClick}
            className="mr-3 text-white hover:bg-white/10 p-1 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
        </div>
        
        <CustomInput
          isSearch
          placeholder="Buscar produtos"
          value={searchTerm}
          onChange={onSearchChange}
          className="mb-4"
        />

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
              <div className="grid grid-cols-1 gap-2 mt-4">
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
              <div className="grid grid-cols-1 gap-2 mt-4">
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
              <button className="flex items-center gap-1 bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                Avaliação <ChevronDown size={16} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtrar por Avaliação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {ratingOptions.map(rating => (
                  <label key={rating.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox"
                      className="mr-2" 
                      checked={selectedRatings.includes(rating.id)} 
                      onChange={() => onRatingClick(rating.id)}
                    />
                    <span className="flex items-center">
                      {rating.label} <Star size={16} className="ml-1 fill-yellow-400 text-yellow-400" />
                    </span>
                  </label>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Selected filters */}
        {(selectedCategories.length > 0 || selectedLojas.length > 0 || selectedRatings.length > 0) && (
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
            
            <button 
              onClick={clearFilters}
              className="text-white text-sm underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MarketplaceHeader;
