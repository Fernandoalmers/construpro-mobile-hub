
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
  if (selectedProducts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {selectedProducts.length} produto(s) selecionado(s):
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
          >
            <ProductItem
              product={product}
              isSelected={true}
              onToggle={() => {}}
              size="sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-100 ml-3"
              onClick={() => onRemoveProduct(product.id)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedProductsList;
