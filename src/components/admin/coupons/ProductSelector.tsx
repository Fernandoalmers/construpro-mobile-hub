
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, X, Package, Plus } from 'lucide-react';
import { fetchProductsForCoupon } from '@/services/adminCouponsService';

interface Product {
  id: string;
  nome: string;
  preco_normal: number;
  imagens?: any[];
  categoria: string;
}

interface ProductSelectorProps {
  selectedProductIds: string[];
  onProductsChange: (productIds: string[]) => void;
  disabled?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductIds,
  onProductsChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar produtos ao abrir o dialog ou mudar termo de busca
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, searchTerm]);

  // Carregar produtos selecionados ao inicializar
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      loadSelectedProducts();
    }
  }, [selectedProductIds]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProductsForCoupon(searchTerm);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedProducts = async () => {
    try {
      const data = await fetchProductsForCoupon();
      const selected = data.filter(product => selectedProductIds.includes(product.id));
      setSelectedProducts(selected);
    } catch (error) {
      console.error('Error loading selected products:', error);
    }
  };

  const handleProductToggle = (product: Product) => {
    const isSelected = selectedProductIds.includes(product.id);
    
    if (isSelected) {
      // Remover produto
      const newIds = selectedProductIds.filter(id => id !== product.id);
      const newSelected = selectedProducts.filter(p => p.id !== product.id);
      onProductsChange(newIds);
      setSelectedProducts(newSelected);
    } else {
      // Adicionar produto
      const newIds = [...selectedProductIds, product.id];
      const newSelected = [...selectedProducts, product];
      onProductsChange(newIds);
      setSelectedProducts(newSelected);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const newIds = selectedProductIds.filter(id => id !== productId);
    const newSelected = selectedProducts.filter(p => p.id !== productId);
    onProductsChange(newIds);
    setSelectedProducts(newSelected);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <Label>Produtos Específicos (Opcional)</Label>
      <p className="text-sm text-gray-600">
        Deixe vazio para aplicar a todos os produtos, ou selecione produtos específicos.
      </p>
      
      {/* Produtos selecionados */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            {selectedProducts.length} produto(s) selecionado(s):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <Badge
                key={product.id}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                <span className="max-w-40 truncate">{product.nome}</span>
                <span className="text-xs">({formatCurrency(product.preco_normal)})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Botão para abrir seletor */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedProducts.length > 0 ? 'Editar Produtos' : 'Selecionar Produtos'}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[600px]">
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de produtos */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Carregando produtos...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum produto encontrado
                </div>
              ) : (
                products.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleProductToggle(product)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">{product.nome}</div>
                          <div className="text-sm text-gray-500">
                            {product.categoria} • {formatCurrency(product.preco_normal)}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 border-2 rounded ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumo */}
            <div className="border-t pt-3">
              <div className="text-sm text-gray-600">
                {selectedProductIds.length} produto(s) selecionado(s)
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductSelector;
