
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '../../../context/AuthContext';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';
import FavoritesLoadingSkeleton from './FavoritesLoadingSkeleton';

interface FavoritesContentProps {
  activeTab: string;
  recentlyViewed: any[];
  favorites: any[];
  frequentlyBought: any[];
  isLoading: boolean;
}

const FavoritesContent: React.FC<FavoritesContentProps> = ({
  activeTab,
  recentlyViewed,
  favorites,
  frequentlyBought,
  isLoading
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mutation to remove a favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      console.log('Removing favorite with ID:', favoriteId);
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) {
        console.error('Error removing favorite:', error);
        throw error;
      }
      return favoriteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast.success('Produto removido dos favoritos');
    },
    onError: (error) => {
      console.error('Remove favorite mutation error:', error);
      toast.error(`Erro ao remover favorito: ${error.message || error}`);
    }
  });

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      let { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();
      
      let cartId: string;
      
      if (cartsError || !carts) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: user?.id, status: 'active' })
          .select('id')
          .single();
        
        if (newCartError) throw newCartError;
        cartId = newCart?.id;
      } else {
        cartId = carts.id;
      }
      
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('preco_normal, preco_promocional')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;
      
      const { data: existingItems, error: existingItemsError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId);
      
      if (existingItemsError) throw existingItemsError;
      
      const price = product?.preco_promocional || product?.preco_normal || 0;
      
      if (existingItems && existingItems.length > 0) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItems[0].quantity + 1,
          })
          .eq('id', existingItems[0].id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: 1,
            price_at_add: price
          });
        
        if (insertError) throw insertError;
      }
      
      toast.success(`${productName} adicionado ao carrinho`);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };
  
  const handleRemoveFavorite = (favoriteId: string) => {
    if (confirm('Tem certeza que deseja remover este produto dos favoritos?')) {
      removeFavoriteMutation.mutate(favoriteId);
    }
  };

  if (isLoading) {
    return <FavoritesLoadingSkeleton />;
  }

  return (
    <>
      {activeTab === "recent" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Vistos recentemente</h2>
            <button 
              className="text-sm text-construPro-blue flex items-center"
              onClick={() => navigate('/marketplace')}
            >
              Ver todos
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <EmptyState type="recent" />
            )}
          </div>
        </>
      )}
      
      {activeTab === "favorites" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Produtos favoritos ({favorites.length})</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {favorites.length > 0 ? (
              favorites.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  showRemoveButton={true}
                  onRemove={handleRemoveFavorite}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <EmptyState type="favorites" />
            )}
          </div>
        </>
      )}
      
      {activeTab === "frequent" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Comprados com frequência</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {frequentlyBought.length > 0 ? (
              frequentlyBought.filter(item => item.produtos !== null).map(item => (
                <ProductCard
                  key={`frequent-${item.produto_id}`}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <EmptyState type="frequent" />
            )}
          </div>
        </>
      )}
    </>
  );
};

export default FavoritesContent;
