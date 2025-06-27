
import React from 'react';
import { Package } from 'lucide-react';
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

interface ProductSearchListProps {
  products: Product[];
  selectedProductIds: string[];
  onProductToggle: (product: Product) => void;
  loading: boolean;
}

const ProductSearchList: React.FC<ProductSearchListProps> = ({
  products,
  selectedProductIds,
  onProductToggle,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm">Carregando produtos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Package className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">Nenhum produto encontrado</p>
        <p className="text-sm text-center max-w-sm">
          Tente ajustar os termos da busca ou verifique se existem produtos aprovados no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-3 sticky top-0 bg-white py-2 border-b">
        {products.length} produto(s) encontrado(s)
        {selectedProductIds.length > 0 && (
          <span className="ml-2 text-blue-600">
            • {selectedProductIds.length} selecionado(s)
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {products.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            isSelected={selectedProductIds.includes(product.id)}
            onToggle={onProductToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductSearchList;
