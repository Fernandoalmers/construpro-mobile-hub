
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import ProductSearchList from './ProductSearchList';

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

interface ProductSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  products: Product[];
  selectedProductIds: string[];
  onProductToggle: (product: Product) => void;
  loading: boolean;
  error: string | null;
}

const ProductSelectorDialog: React.FC<ProductSelectorDialogProps> = ({
  isOpen,
  onOpenChange,
  searchTerm,
  onSearchTermChange,
  products,
  selectedProductIds,
  onProductToggle,
  loading,
  error
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Selecionar Produtos</DialogTitle>
          <DialogDescription>
            Selecione os produtos específicos para este cupom. Deixe vazio para aplicar a todos os produtos.
          </DialogDescription>
        </DialogHeader>
        
        {/* Search Bar - Fixed at top */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar produtos por nome..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Products List - Scrollable content */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 mb-2">Erro ao carregar produtos</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <ProductSearchList
                products={products}
                selectedProductIds={selectedProductIds}
                onProductToggle={onProductToggle}
                loading={loading}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorDialog;
