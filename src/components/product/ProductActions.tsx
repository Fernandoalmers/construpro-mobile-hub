
import React, { useEffect } from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { useNavigate } from 'react-router-dom';

interface ProductActionsProps {
  productId: string;
  quantity: number;
  maxStock?: number;
}

const ProductActions: React.FC<ProductActionsProps> = ({ productId, quantity, maxStock }) => {
  const navigate = useNavigate();
  const { addToCart, isLoading } = useCart();
  const [addingToCart, setAddingToCart] = React.useState(false);
  const [buyingNow, setBuyingNow] = React.useState(false);
  
  const isOutOfStock = maxStock !== undefined && maxStock <= 0;

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
      setAddingToCart(true);
      console.log("ProductActions: Adding to cart, productId:", productId, "quantity:", quantity);
      await addToCart(productId, quantity);
      console.log("ProductActions: Successfully added to cart");
    } catch (error) {
      console.error('Error in onAddToCart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
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
      setBuyingNow(true);
      console.log("ProductActions: Buying now, productId:", productId, "quantity:", quantity);
      await addToCart(productId, quantity);
      navigate('/cart');
    } catch (error) {
      console.error('Error in onBuyNow:', error);
      toast.error('Erro ao processar compra');
    } finally {
      setBuyingNow(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <Button 
        variant="default"
        className="w-full bg-construPro-blue hover:bg-blue-700 text-white py-3 text-base flex items-center justify-center"
        onClick={onAddToCart}
        disabled={addingToCart || buyingNow || isLoading || isOutOfStock}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </Button>
      
      <Button
        variant="default"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={onBuyNow}
        disabled={addingToCart || buyingNow || isLoading || isOutOfStock}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {buyingNow ? 'Processando...' : 'Comprar Agora'}
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
