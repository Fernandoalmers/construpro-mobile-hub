
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProductStateProps {
  onNewProduct: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  hasProducts: boolean;
}

const EmptyProductState: React.FC<EmptyProductStateProps> = ({ 
  onNewProduct, 
  onClearFilters, 
  onRefresh, 
  hasProducts 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium">Nenhum produto encontrado</h3>
      <p className="mt-1 text-gray-500">
        {hasProducts 
          ? "Tente ajustar os filtros ou realizar uma busca diferente." 
          : "Você ainda não possui produtos cadastrados."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {hasProducts ? (
          <Button variant="outline" onClick={onClearFilters}>Limpar Filtros</Button>
        ) : (
          <Button onClick={onNewProduct}>Cadastrar Produto</Button>
        )}
        <Button variant="outline" onClick={onRefresh}>Atualizar</Button>
      </div>
    </div>
  );
};

export default EmptyProductState;
