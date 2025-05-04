
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/services/cartService';
import { addToFavorites } from '@/services/cartService';
import { Heart, ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '@/services/productService';

interface ProductActionsProps {
  produto: Product;
  quantidade: number;
  isFavorited: boolean;
  validateQuantity: () => void;
  isAuthenticated: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  produto,
  quantidade,
  isFavorited,
  validateQuantity,
  isAuthenticated
}) => {
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToFavorites, setAddingToFavorites] = useState(false);

  const handleAddToCart = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    validateQuantity();
    
    try {
      setAddingToCart(true);
      const result = await addToCart(produto.id, quantidade);
      
      if (result) {
        toast.success(`${produto.nome} adicionado ao carrinho`);
      } else {
        toast.error('Erro ao adicionar ao carrinho');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };
  
  const handleBuyNow = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    validateQuantity();
    
    try {
      setAddingToCart(true);
      const result = await addToCart(produto.id, quantidade);
      
      if (result) {
        navigate('/cart?checkout=true');
      } else {
        toast.error('Erro ao processar compra');
      }
    } catch (err) {
      console.error('Error in buy now:', err);
      toast.error('Erro ao processar compra');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    try {
      setAddingToFavorites(true);
      if (!isFavorited) {
        const result = await addToFavorites(produto.id);
        
        if (result) {
          toast.success(`${produto.nome} adicionado aos favoritos`);
        } else {
          toast.error('Erro ao adicionar aos favoritos');
        }
      } else {
        // For now just show a success message as we're not implementing remove yet
        toast.info('Produto já está nos favoritos');
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      toast.error('Erro ao modificar favoritos');
    } finally {
      setAddingToFavorites(false);
    }
  };
  
  const handleChatWithStore = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    // In a full implementation, this would open a chat with the store
    toast.info('Funcionalidade de chat em desenvolvimento');
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center gap-2">
        <Button 
          className="flex-1 gap-2" 
          onClick={handleAddToCart}
          disabled={addingToCart}
        >
          <ShoppingCart size={18} />
          Adicionar ao Carrinho
        </Button>
        <Button 
          variant="outline" 
          className={`aspect-square p-0 ${isFavorited ? 'text-red-500 border-red-500' : ''}`}
          onClick={handleToggleFavorite}
          disabled={addingToFavorites}
        >
          <Heart size={18} className={isFavorited ? "fill-red-500" : ""} />
        </Button>
      </div>
      <Button 
        variant="secondary" 
        className="w-full"
        onClick={handleBuyNow}
        disabled={addingToCart}
      >
        Comprar Agora
      </Button>
      {produto.stores?.id && (
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleChatWithStore}
        >
          <MessageCircle size={18} />
          Chat com a Loja
        </Button>
      )}
    </div>
  );
};

export default ProductActions;
