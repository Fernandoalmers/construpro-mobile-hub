
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { fetchProductsForCoupon } from '@/services/adminCouponsService';
import SelectedProductsList from './components/SelectedProductsList';
import ProductSelectorDialog from './components/ProductSelectorDialog';

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

  return (
    <div className="space-y-3">
      <Label>Produtos Específicos (Opcional)</Label>
      <p className="text-sm text-gray-600">
        Deixe vazio para aplicar a todos os produtos, ou selecione produtos específicos.
      </p>
      
      {/* Produtos selecionados */}
      <SelectedProductsList
        selectedProducts={selectedProducts}
        onRemoveProduct={handleRemoveProduct}
        disabled={disabled}
      />

      {/* Botão para abrir seletor */}
      <ProductSelectorDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        products={products}
        selectedProductIds={selectedProductIds}
        onProductToggle={handleProductToggle}
        loading={loading}
      />
      
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {selectedProducts.length > 0 ? 'Editar Produtos' : 'Selecionar Produtos'}
        </Button>
      </DialogTrigger>
    </div>
  );
};

export default ProductSelector;
