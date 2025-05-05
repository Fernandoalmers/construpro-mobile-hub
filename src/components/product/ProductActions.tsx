
import React from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartActions } from '@/hooks/use-cart-actions';
import { toast } from '@/components/ui/sonner';

interface ProductActionsProps {
  productId: string;
  quantity: number;
}

const ProductActions: React.FC<ProductActionsProps> = ({ productId, quantity }) => {
  const { handleAddToCart, handleBuyNow, isAddingToCart, isBuyingNow } = useCartActions();
  
  const isAddingThisToCart = productId ? isAddingToCart[productId] : false;
  const isBuyingThisNow = productId ? isBuyingNow[productId] : false;

  const onAddToCart = async () => {
    if (!productId) {
      toast.error("ID do produto inválido");
      return;
    }
    
    try {
      await handleAddToCart(productId, quantity);
    } catch (error) {
      console.error('Error in onAddToCart:', error);
      // Error is already handled in handleAddToCart
    }
  };

  const onBuyNow = async () => {
    if (!productId) {
      toast.error("ID do produto inválido");
      return;
    }
    
    try {
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
        disabled={isAddingThisToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAddingThisToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </Button>
      
      <Button
        variant="default"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={onBuyNow}
        disabled={isBuyingThisNow}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {isBuyingThisNow ? 'Processando...' : 'Comprar Agora'}
      </Button>
    </div>
  );
};

export default ProductActions;
