
import React from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow
} from '@/components/ui/table';
import { AdminProduct } from '@/types/admin';
import ProductTableRow from './ProductTableRow';

interface ProductsTableProps {
  products: AdminProduct[];
  handleApproveProduct: (id: string) => void;
  handleRejectProduct: (id: string) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products,
  handleApproveProduct,
  handleRejectProduct 
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Pontos</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductTableRow 
              key={product.id} 
              product={product} 
              handleApproveProduct={handleApproveProduct}
              handleRejectProduct={handleRejectProduct}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
