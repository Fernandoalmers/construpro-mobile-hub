
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

// Hook personalizado para debounce otimizado
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  const [error, setError] = useState<string | null>(null);

  // Reduzir debounce para melhor responsividade
  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  // Buscar produtos quando o modal abre ou quando o termo de busca muda
  useEffect(() => {
    if (isOpen) {
      loadProducts(debouncedSearchTerm);
    }
  }, [isOpen, debouncedSearchTerm]);

  // Carregar produtos selecionados ao inicializar
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      loadSelectedProducts();
    } else {
      setSelectedProducts([]);
    }
  }, [selectedProductIds]);

  const loadProducts = async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchProductsForCoupon(searchTerm);
      
      // Transformar os dados para incluir informações do vendedor
      const transformedProducts = data.map(product => ({
        ...product,
        vendedores: product.vendedores || { nome_loja: 'Vendedor não informado' }
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Erro ao carregar produtos. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedProducts = async () => {
    try {
      const data = await fetchProductsForCoupon();
      const transformedData = data.map(product => ({
        ...product,
        vendedores: product.vendedores || { nome_loja: 'Vendedor não informado' }
      }));
      const selected = transformedData.filter(product => selectedProductIds.includes(product.id));
      setSelectedProducts(selected);
    } catch (error) {
      console.error('Error loading selected products:', error);
    }
  };

  const handleProductToggle = useCallback((product: Product) => {
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
  }, [selectedProductIds, selectedProducts, onProductsChange]);

  const handleRemoveProduct = useCallback((productId: string) => {
    const newIds = selectedProductIds.filter(id => id !== productId);
    const newSelected = selectedProducts.filter(p => p.id !== productId);
    onProductsChange(newIds);
    setSelectedProducts(newSelected);
  }, [selectedProductIds, selectedProducts, onProductsChange]);

  const handleOpenDialog = () => {
    setSearchTerm(''); // Limpar busca ao abrir
    setIsOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm(''); // Limpar busca ao fechar
      setProducts([]); // Limpar produtos para economizar memória
      setError(null);
    }
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
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={handleOpenDialog}
      >
        <Plus className="h-4 w-4 mr-2" />
        {selectedProducts.length > 0 ? 
          `Editar Produtos (${selectedProducts.length} selecionados)` : 
          'Selecionar Produtos'
        }
      </Button>

      {/* Dialog de seleção */}
      <ProductSelectorDialog
        isOpen={isOpen}
        onOpenChange={handleCloseDialog}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        products={products}
        selectedProductIds={selectedProductIds}
        onProductToggle={handleProductToggle}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default ProductSelector;
