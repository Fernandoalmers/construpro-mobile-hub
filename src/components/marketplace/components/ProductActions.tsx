
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
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
  const { isAddingToCart, isBuyingNow, handleAddToCart, handleBuyNow } = useCartActions();
  
  const handleAddToCartClick = async () => {
    // Validate quantity before adding to cart
    validateQuantity();
    
    try {
      // Use the cartActions hook to handle adding to cart
      const success = await handleAddToCart(produto.id, quantidade);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Erro ao adicionar ao carrinho");
    }
  };

  const handleBuyNowClick = async () => {
    // Validate quantity before buying
    validateQuantity();
    
    try {
      // This will add to cart and navigate to cart page
      await handleBuyNow(produto.id, quantidade);
    } catch (error: any) {
      console.error("Error buying now:", error);
      toast.error(error.message || "Erro ao processar compra");
    }
  };

  const isButtonDisabled = !produto.estoque || produto.estoque < 1;
  
  if (size === 'compact') {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleAddToCartClick}
          disabled={isButtonDisabled || isAddingToCart[produto.id]}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          {isAddingToCart[produto.id] ? "Adicionando..." : "Adicionar"}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleBuyNowClick}
          disabled={isButtonDisabled || isBuyingNow[produto.id]}
        >
          <ShoppingBag className="mr-1 h-4 w-4" />
          {isBuyingNow[produto.id] ? "Processando..." : "Comprar"}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-3">
      <Button
        className="w-full bg-construPro-blue hover:bg-blue-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleAddToCartClick}
        disabled={isButtonDisabled || isAddingToCart[produto.id]}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingToCart[produto.id] ? "Adicionando ao Carrinho..." : "Adicionar ao Carrinho"}
      </Button>
      
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleBuyNowClick}
        disabled={isButtonDisabled || isBuyingNow[produto.id]}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {isBuyingNow[produto.id] ? "Processando..." : "Comprar Agora"}
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
