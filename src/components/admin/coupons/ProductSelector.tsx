
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, X, Package, Plus } from 'lucide-react';
import { fetchProductsForCoupon } from '@/services/adminCouponsService';
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

  const getVendorName = (product: Product): string => {
    return product.vendedores?.nome_loja || product.lojaNome || 'Vendedor não informado';
  };

  const getStockStatus = (estoque: number) => {
    if (estoque === 0) return { text: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (estoque <= 5) return { text: `${estoque} restantes`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `${estoque} em estoque`, color: 'bg-green-100 text-green-800' };
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
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
              >
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
                        <Badge className={`text-xs ${getStockStatus(product.estoque).color}`}>
                          {getStockStatus(product.estoque).text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-100"
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de produtos */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Carregando produtos...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  Nenhum produto encontrado
                </div>
              ) : (
                products.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const stockStatus = getStockStatus(product.estoque);
                  
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleProductToggle(product)}
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
                })
              )}
            </div>

            {/* Resumo */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedProductIds.length} produto(s) selecionado(s)
                </div>
                {selectedProductIds.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
    </div>
  );
};

export default ProductSelector;
