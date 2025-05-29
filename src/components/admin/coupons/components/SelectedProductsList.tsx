
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Package } from 'lucide-react';
import ProductItem from './ProductItem';

interface Product {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number | null;
  imagens?: any[];
  categoria: string;
  estoque: number;
  vendedores?: { nome_loja: string };
  lojaNome?: string;
}

interface SelectedProductsListProps {
  selectedProducts: Product[];
  onRemoveProduct: (productId: string) => void;
  disabled?: boolean;
}

const SelectedProductsList: React.FC<SelectedProductsListProps> = ({
  selectedProducts,
  onRemoveProduct,
  disabled = false
}) => {
  if (selectedProducts.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">
            Nenhum produto selecionado
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Clique em "Selecionar Produtos" para adicionar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          {selectedProducts.length} produto(s) selecionado(s):
        </div>
        {selectedProducts.length > 3 && (
          <div className="text-xs text-gray-500">
            Mostrando primeiros produtos
          </div>
        )}
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <ProductItem
                product={product}
                isSelected={true}
                onToggle={() => {}}
                size="sm"
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 ml-3 flex-shrink-0"
              onClick={() => onRemoveProduct(product.id)}
              disabled={disabled}
              title="Remover produto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      {selectedProducts.length > 3 && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          {selectedProducts.length - 3} produto(s) adicional(is) selecionado(s)
        </div>
      )}
    </div>
  );
};

export default SelectedProductsList;
