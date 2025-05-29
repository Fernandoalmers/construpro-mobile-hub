
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, AlertCircle } from 'lucide-react';
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
  error?: string | null;
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
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Selecionar Produtos para o Cupom
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Busca */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos por nome..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Lista de produtos */}
          <div className="flex-1 min-h-0">
            <ProductSearchList
              products={products}
              selectedProductIds={selectedProductIds}
              onProductToggle={onProductToggle}
              loading={loading}
            />
          </div>

          {/* Rodapé com resumo e ações */}
          <div className="border-t pt-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedProductIds.length > 0 ? (
                  <span className="font-medium text-blue-600">
                    {selectedProductIds.length} produto(s) selecionado(s)
                  </span>
                ) : (
                  'Nenhum produto selecionado'
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="button"
                  onClick={handleClose}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={selectedProductIds.length === 0}
                >
                  Confirmar Seleção
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorDialog;
