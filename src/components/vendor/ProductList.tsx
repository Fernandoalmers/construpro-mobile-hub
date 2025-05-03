
import React from 'react';
import ListEmptyState from '../common/ListEmptyState';
import { ShoppingBag } from 'lucide-react';
import ProductItem from './ProductItem';
import { VendorProduct } from '@/services/vendorService';

interface ProductListProps {
  products: VendorProduct[];
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onClearFilters: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  onToggleStatus,
  onDelete,
  onEdit,
  onClearFilters 
}) => {
  if (products.length === 0) {
    return (
      <ListEmptyState
        title="Nenhum produto encontrado"
        description="Tente mudar os filtros ou buscar por outro termo."
        icon={<ShoppingBag size={40} />}
        action={{
          label: "Limpar filtros",
          onClick: onClearFilters
        }}
      />
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {products.map(produto => (
        <ProductItem 
          key={produto.id} 
          produto={produto} 
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default ProductList;
