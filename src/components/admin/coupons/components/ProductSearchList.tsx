
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
      <div className="text-center py-8 text-gray-500">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Carregando produtos...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        Nenhum produto encontrado
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-3">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          isSelected={selectedProductIds.includes(product.id)}
          onToggle={onProductToggle}
        />
      ))}
    </div>
  );
};

export default ProductSearchList;
