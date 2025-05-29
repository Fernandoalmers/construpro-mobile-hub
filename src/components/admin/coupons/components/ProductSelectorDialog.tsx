
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

const ProductSelectorDialog: React.FC<ProductSelectorDialogProps> = ({
  isOpen,
  onOpenChange,
  searchTerm,
  onSearchTermChange,
  products,
  selectedProductIds,
  onProductToggle,
  loading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[700px]">
        <DialogHeader>
          <DialogTitle>Selecionar Produtos para o Cupom</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de produtos */}
          <ProductSearchList
            products={products}
            selectedProductIds={selectedProductIds}
            onProductToggle={onProductToggle}
            loading={loading}
          />

          {/* Resumo */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedProductIds.length} produto(s) selecionado(s)
              </div>
              {selectedProductIds.length > 0 && (
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Concluir Seleção
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorDialog;
