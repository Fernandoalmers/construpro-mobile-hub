
import React, { useEffect } from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartActions } from '@/hooks/use-cart-actions';
import { toast } from '@/components/ui/sonner';

interface ProductActionsProps {
  productId: string;
  quantity: number;
  maxStock?: number;
}

const ProductActions: React.FC<ProductActionsProps> = ({ productId, quantity, maxStock }) => {
  const { handleAddToCart, handleBuyNow, isAddingToCart, isBuyingNow, clearAllTimeouts } = useCartActions();
  
  const isAddingThisToCart = productId ? isAddingToCart[productId] : false;
  const isBuyingThisNow = productId ? isBuyingNow[productId] : false;
  const isOutOfStock = maxStock !== undefined && maxStock <= 0;

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const onAddToCart = async () => {
    if (!productId) {
      toast.error("ID do produto inválido");
      console.error("ProductActions: Invalid product ID");
      return;
    }
    
    if (isOutOfStock) {
      toast.error("Produto sem estoque disponível");
      console.error("ProductActions: Product out of stock");
      return;
    }
    
    try {
      console.log("ProductActions: Adding to cart, productId:", productId, "quantity:", quantity);
      const result = await handleAddToCart(productId, quantity);
      console.log("ProductActions: Add to cart result:", result);
    } catch (error) {
      console.error('Error in onAddToCart:', error);
      // Error is already handled in handleAddToCart
    }
  };

  const onBuyNow = async () => {
    if (!productId) {
      toast.error("ID do produto inválido");
      console.error("ProductActions: Invalid product ID");
      return;
    }
    
    if (isOutOfStock) {
      toast.error("Produto sem estoque disponível");
      console.error("ProductActions: Product out of stock");
      return;
    }
    
    try {
      console.log("ProductActions: Buying now, productId:", productId, "quantity:", quantity);
      await handleBuyNow(productId, quantity);
    } catch (error) {
      console.error('Error in onBuyNow:', error);
      // Error is already handled in handleBuyNow
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <Button 
        variant="default"
        className="w-full bg-construPro-blue hover:bg-blue-700 text-white py-3 text-base flex items-center justify-center"
        onClick={onAddToCart}
        disabled={isAddingThisToCart || isBuyingThisNow || isOutOfStock}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingThisToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </Button>
      
      <Button
        variant="default"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={onBuyNow}
        disabled={isAddingThisToCart || isBuyingThisNow || isOutOfStock}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {isBuyingThisNow ? 'Processando...' : 'Comprar Agora'}
      </Button>
      
      {isOutOfStock && (
        <p className="text-red-500 text-center text-sm">
          Produto fora de estoque
        </p>
      )}
    </div>
  );
};

export default ProductActions;
