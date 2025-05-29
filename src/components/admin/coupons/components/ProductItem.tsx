
import React from 'react';
import { Badge } from '@/components/ui/badge';
import ProductImage from '@/components/admin/products/components/ProductImage';
import PriceDisplay from '@/components/admin/products/components/PriceDisplay';

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

interface ProductItemProps {
  product: Product;
  isSelected: boolean;
  onToggle: (product: Product) => void;
  size?: 'sm' | 'lg';
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  isSelected,
  onToggle,
  size = 'lg'
}) => {
  const getVendorName = (product: Product): string => {
    return product.vendedores?.nome_loja || product.lojaNome || 'Vendedor não informado';
  };

  const getStockStatus = (estoque: number) => {
    if (estoque === 0) return { text: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (estoque <= 5) return { text: `${estoque} restantes`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `${estoque} em estoque`, color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus(product.estoque);

  if (size === 'sm') {
    return (
      <div className="flex items-center space-x-3">
        <ProductImage
          imagens={product.imagens}
          productName={product.nome}
          size="sm"
        />
        <div className="flex-1">
          <div className="font-medium text-sm">{product.nome}</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>{product.categoria} • {getVendorName(product)}</div>
            <div className="flex items-center space-x-2">
              <PriceDisplay 
                preco={product.preco_normal} 
                preco_promocional={product.preco_promocional}
              />
              <Badge className={`text-xs ${stockStatus.color}`}>
                {stockStatus.text}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onToggle(product)}
    >
      <div className="flex items-center space-x-4 flex-1">
        <ProductImage
          imagens={product.imagens}
          productName={product.nome}
          size="lg"
        />
        
        <div className="flex-1 space-y-2">
          <div>
            <div className="font-medium text-base">{product.nome}</div>
            <div className="text-sm text-gray-600">
              {product.categoria} • {getVendorName(product)}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <PriceDisplay 
              preco={product.preco_normal} 
              preco_promocional={product.preco_promocional}
            />
            
            <Badge className={`text-xs ${stockStatus.color}`}>
              {stockStatus.text}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
        isSelected 
          ? 'bg-blue-500 border-blue-500' 
          : 'border-gray-300'
      }`}>
        {isSelected && (
          <div className="w-3 h-3 bg-white rounded-full" />
        )}
      </div>
    </div>
  );
};

export default ProductItem;
