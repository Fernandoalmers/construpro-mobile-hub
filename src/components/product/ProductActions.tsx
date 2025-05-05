
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { addToCart } from '@/services/cart';

interface ProductActionsProps {
  productId: string;
  quantity: number;
}

const ProductActions: React.FC<ProductActionsProps> = ({ productId, quantity }) => {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(productId, quantity);
      toast.success('Produto adicionado ao carrinho');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setBuying(true);
      await addToCart(productId, quantity);
      navigate('/cart');
    } catch (err) {
      console.error('Error buying now:', err);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <Button 
        className="w-full bg-construPro-blue hover:bg-blue-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleAddToCart}
        disabled={adding}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {adding ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </Button>
      
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base flex items-center justify-center"
        onClick={handleBuyNow}
        disabled={buying}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {buying ? 'Processando...' : 'Comprar Agora'}
      </Button>
    </div>
  );
};

export default ProductActions;
