
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartActions } from '@/hooks/use-cart-actions';
import { toast } from '@/components/ui/sonner';

interface ProductActionsProps {
  produto: any;
  quantidade: number;
  isFavorited: boolean;
  validateQuantity: () => void;
  isAuthenticated: boolean;
  onSuccess?: () => void;
  size?: 'default' | 'compact';
}

const ProductActions: React.FC<ProductActionsProps> = ({
  produto,
  quantidade,
  isFavorited,
  validateQuantity,
  isAuthenticated,
  onSuccess,
  size = 'default',
}) => {
  const navigate = useNavigate();
  const { isAddingToCart, isBuyingNow, handleAddToCart, handleBuyNow, clearAllTimeouts } = useCartActions();
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log("ProductActions: handleAddToCartClick called for", produto?.id);
      // Validate quantity before adding to cart
      validateQuantity();
      
      if (!produto) {
        toast.error("Produto não encontrado ou não está disponível");
        console.error("Erro: produto inválido ou não disponível", produto);
        return;
      }
      
      if (!produto.id) {
        toast.error("ID do produto não encontrado");
        console.error("Erro: ID do produto não disponível", produto);
        return;
      }
      
      console.log("Adicionando ao carrinho:", produto.id, "quantidade:", quantidade);
      
      // Use the cartActions hook to handle adding to cart
      const success = await handleAddToCart(produto.id, quantidade);
      if (success && onSuccess) {
        console.log("Product added to cart successfully, calling onSuccess");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Erro ao adicionar ao carrinho");
    }
  };

  const handleBuyNowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log("ProductActions: handleBuyNowClick called for", produto?.id);
      // Validate quantity before buying
      validateQuantity();
      
      if (!produto) {
        toast.error("Produto não encontrado ou não está disponível");
        console.error("Erro: produto inválido ou não disponível", produto);
        return;
      }
      
      if (!produto.id) {
        toast.error("ID do produto não encontrado");
        console.error("Erro: ID do produto não disponível", produto);
        return;
      }
      
      console.log("Comprando agora:", produto.id, "quantidade:", quantidade);
      
      // This will add to cart and navigate to cart page
      await handleBuyNow(produto.id, quantidade);
    } catch (error: any) {
      console.error("Error buying now:", error);
      toast.error(error.message || "Erro ao processar compra");
    }
  };

  // Check if button should be disabled
  const isButtonDisabled = !produto || !produto.estoque || produto.estoque < 1;
  const isAddingToCartActive = produto?.id ? isAddingToCart[produto.id] : false;
  const isBuyingNowActive = produto?.id ? isBuyingNow[produto.id] : false;
  const anyActionInProgress = isAddingToCartActive || isBuyingNowActive;
  
  if (size === 'compact') {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleAddToCartClick}
          disabled={isButtonDisabled || anyActionInProgress}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          {isAddingToCartActive ? "Adicionando..." : "Adicionar"}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleBuyNowClick}
          disabled={isButtonDisabled || anyActionInProgress}
        >
          <ShoppingBag className="mr-1 h-4 w-4" />
          {isBuyingNowActive ? "Processando..." : "Comprar"}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-3">
      <Button
        className="w-full bg-construPro-blue hover:bg-blue-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleAddToCartClick}
        disabled={isButtonDisabled || anyActionInProgress}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingToCartActive ? "Adicionando ao Carrinho..." : "Adicionar ao Carrinho"}
      </Button>
      
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleBuyNowClick}
        disabled={isButtonDisabled || anyActionInProgress}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {isBuyingNowActive ? "Processando..." : "Comprar Agora"}
      </Button>
      
      {isButtonDisabled && (
        <p className="text-red-500 text-xs text-center">
          Produto fora de estoque
        </p>
      )}
    </div>
  );
};

export default ProductActions;
