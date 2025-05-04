
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProductStateProps {
  clearFilters: () => void;
}

const EmptyProductState: React.FC<EmptyProductStateProps> = ({ clearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <ShoppingBag size={48} className="text-gray-400 mb-4" />
      <h3 className="font-bold text-xl mb-2">Nenhum produto encontrado</h3>
      <p className="text-gray-500 text-center mb-6">Tente mudar os filtros ou buscar por outro termo.</p>
      <Button 
        className="bg-construPro-blue text-white px-4 py-2 rounded-md"
        onClick={clearFilters}
      >
        Limpar filtros
      </Button>
    </div>
  );
};

export default EmptyProductState;
