import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bookmark, Clock, ShoppingBag, ChevronRight, Star, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomButton from '../common/CustomButton';
import { toast } from "@/components/ui/sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string;
  avaliacao: number;
  categoria: string;
  descricao: string;
  loja_id?: string;
  loja_nome?: string; // Added for display purposes
}

interface RecentlyViewed {
  id: string;
  user_id: string;
  produto_id: string;
  data_visualizacao: string;
  produto: Product; // Joined product data
}

interface FavoriteItem {
  id: string;
  user_id: string;
  produto_id: string;
  data_adicionado: string;
  produto: Product; // Joined product data
}

// Updated FrequentlyBoughtItem interface to match what we're getting from the database
interface FrequentlyBoughtItem {
  produto_id: string;
  count: number;
  produto: Product | null; // Making produto nullable since it might have an error
}

const FavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("recent");
  
  // Fetch recently viewed products
  const { 
    data: recentlyViewed = [], 
    isLoading: isLoadingRecent,
    error: recentError
  } = useQuery({
    queryKey: ['recentlyViewed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recently_viewed')
        .select(`
          *,
          produto:produto_id (
            id, nome, preco, imagem_url, avaliacao, categoria, descricao,
            loja_id
          )
        `)
        .eq('user_id', user?.id || '')
        .order('data_visualizacao', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Fetch store names for products
      const productsWithLojaId = data
        .filter(item => item.produto && item.produto.loja_id)
        .map(item => ({ 
          ...item, 
          loja_id: item.produto.loja_id 
        }));
      
      if (productsWithLojaId.length > 0) {
        const lojaIds = [...new Set(productsWithLojaId.map(item => item.loja_id))];
        
        const { data: lojas, error: lojasError } = await supabase
          .from('stores')
          .select('id, nome')
          .in('id', lojaIds);
        
        if (!lojasError && lojas) {
          const lojaMap = Object.fromEntries(lojas.map(loja => [loja.id, loja.nome]));
          
          return data.map(item => ({
            ...item,
            produto: item.produto ? {
              ...item.produto,
              loja_nome: item.produto.loja_id ? lojaMap[item.produto.loja_id] : undefined
            } : null
          }));
        }
      }
      
      return data;
    },
    enabled: !!user?.id
  });
  
  // Fetch favorite products
  const { 
    data: favorites = [], 
    isLoading: isLoadingFavorites,
    error: favoritesError
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          produto:produto_id (
            id, nome, preco, imagem_url, avaliacao, categoria, descricao,
            loja_id
          )
        `)
        .eq('user_id', user?.id || '');
      
      if (error) throw error;
      
      // Fetch store names for products
      const productsWithLojaId = data
        .filter(item => item.produto && item.produto.loja_id)
        .map(item => ({ 
          ...item, 
          loja_id: item.produto.loja_id 
        }));
      
      if (productsWithLojaId.length > 0) {
        const lojaIds = [...new Set(productsWithLojaId.map(item => item.loja_id))];
        
        const { data: lojas, error: lojasError } = await supabase
          .from('stores')
          .select('id, nome')
          .in('id', lojaIds);
        
        if (!lojasError && lojas) {
          const lojaMap = Object.fromEntries(lojas.map(loja => [loja.id, loja.nome]));
          
          return data.map(item => ({
            ...item,
            produto: item.produto ? {
              ...item.produto,
              loja_nome: item.produto.loja_id ? lojaMap[item.produto.loja_id] : undefined
            } : null
          }));
        }
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Most frequently bought products
  const { 
    data: frequentlyBought = [], 
    isLoading: isLoadingFrequent,
    error: frequentError
  } = useQuery({
    queryKey: ['frequentlyBought'],
    queryFn: async () => {
      try {
        // Fetch product IDs and counts from order items
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('produto_id, count(*)')
          .eq('order_id', user?.id || '')
          .limit(8);
          
        if (orderItemsError) throw orderItemsError;
        
        // If we have order items, fetch the product details separately
        if (orderItems && orderItems.length > 0) {
          const productIds = orderItems.map(item => item.produto_id);
          
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
              id, nome, preco, imagem_url, avaliacao, categoria, descricao, 
              loja_id
            `)
            .in('id', productIds);
          
          if (productsError) throw productsError;
          
          // Map product details to order items
          const enrichedItems = orderItems.map(item => {
            const matchingProduct = products?.find(p => p.id === item.produto_id) || null;
            return {
              produto_id: item.produto_id,
              count: item.count,
              produto: matchingProduct
            };
          }).filter(item => item.produto !== null); // Filter out items where product wasn't found
          
          // Fetch store names for products with loja_id
          const lojaIds = enrichedItems
            .filter(item => item.produto && item.produto.loja_id)
            .map(item => item.produto?.loja_id)
            .filter(Boolean) as string[];
          
          if (lojaIds.length > 0) {
            const { data: lojas, error: lojasError } = await supabase
              .from('stores')
              .select('id, nome')
              .in('id', lojaIds);
            
            if (!lojasError && lojas) {
              const lojaMap = Object.fromEntries(lojas.map(loja => [loja.id, loja.nome]));
              
              // Add store names to products
              return enrichedItems.map(item => ({
                ...item,
                produto: item.produto ? {
                  ...item.produto,
                  loja_nome: item.produto.loja_id ? lojaMap[item.produto.loja_id] : undefined
                } : null
              }));
            }
          }
          
          return enrichedItems;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching frequently bought products:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });
  
  // Mutation to remove a favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) throw error;
      return favoriteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Produto removido dos favoritos');
    },
    onError: (error) => {
      toast.error(`Erro ao remover favorito: ${error}`);
    }
  });
  
  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      // First, check if the user already has an active cart
      let { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();
      
      let cartId: string;
      
      // If no active cart exists, create one
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
      
      // Get product price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('preco')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;
      
      // Check if item already exists in cart
      const { data: existingItems, error: existingItemsError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId);
      
      if (existingItemsError) throw existingItemsError;
      
      if (existingItems && existingItems.length > 0) {
        // Update existing cart item
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItems[0].quantity + 1,
          })
          .eq('id', existingItems[0].id);
        
        if (updateError) throw updateError;
      } else {
        // Add new cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: 1,
            price_at_add: product?.preco || 0
          });
        
        if (insertError) throw insertError;
      }
      
      toast.success(`${productName} adicionado ao carrinho`);
      
      // Signal that the cart was updated - useful for updating UI components
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
  
  // Render a product card
  const renderProductCard = (item: RecentlyViewed | FavoriteItem | FrequentlyBoughtItem) => {
    // Check if it's a FrequentlyBoughtItem (doesn't have id field)
    if (!('id' in item)) {
      // For FrequentlyBoughtItem, we need to handle it differently
      if (!item.produto) return null;
      
      const product = item.produto;
      
      return (
        <Card key={`frequent-${item.produto_id}`} className="overflow-hidden">
          <div 
            className="h-40 bg-center bg-cover"
            style={{ backgroundImage: `url(${product.imagem_url || '/placeholder.svg'})` }}
            onClick={() => navigate(`/marketplace/produto/${product.id}`)}
          />
          <div className="p-3">
            <h3 className="font-medium truncate">{product.nome}</h3>
            {product.loja_nome && (
              <p className="text-xs text-gray-500">{product.loja_nome}</p>
            )}
            <div className="flex items-center mt-1 mb-2">
              <div className="flex items-center">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs ml-1">{product.avaliacao.toFixed(1)}</span>
              </div>
              <span className="text-xs ml-2 text-gray-500">Comprado {item.count}x</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-construPro-blue">
                R$ {product.preco.toFixed(2)}
              </span>
              
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => handleAddToCart(product.id, product.nome)}
                icon={<ShoppingBag size={14} />}
              >
                Comprar
              </CustomButton>
            </div>
          </div>
        </Card>
      );
    }
    
    // Original logic for RecentlyViewed and FavoriteItem
    if (!item.produto) return null;
    
    const product = item.produto;
    const isFavoriteTab = activeTab === "favorites";
    
    return (
      <Card key={item.id} className="overflow-hidden">
        {isFavoriteTab && (
          <button 
            className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md"
            onClick={() => handleRemoveFavorite(item.id)}
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        )}
        <div 
          className="h-40 bg-center bg-cover"
          style={{ backgroundImage: `url(${product.imagem_url || '/placeholder.svg'})` }}
          onClick={() => navigate(`/marketplace/produto/${product.id}`)}
        />
        <div className="p-3">
          <h3 className="font-medium truncate">{product.nome}</h3>
          {product.loja_nome && (
            <p className="text-xs text-gray-500">{product.loja_nome}</p>
          )}
          <div className="flex items-center mt-1 mb-2">
            <div className="flex items-center">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs ml-1">{product.avaliacao.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-construPro-blue">
              R$ {product.preco.toFixed(2)}
            </span>
            
            <CustomButton
              variant="primary"
              size="sm"
              onClick={() => handleAddToCart(product.id, product.nome)}
              icon={<ShoppingBag size={14} />}
            >
              Comprar
            </CustomButton>
          </div>
        </div>
      </Card>
    );
  };

  // Loading states
  const isLoading = 
    (activeTab === "recent" && isLoadingRecent) || 
    (activeTab === "favorites" && isLoadingFavorites) || 
    (activeTab === "frequent" && isLoadingFrequent);

  // Error handling
  if (recentError || favoritesError || frequentError) {
    const error = recentError || favoritesError || frequentError;
    toast.error(`Erro ao carregar dados: ${(error as Error).message}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Favoritos</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 -mt-6">
        <Card className="p-2">
          <Tabs defaultValue="recent" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100">
              <TabsTrigger value="recent" className="flex-1">
                <Clock size={14} className="mr-1" />
                Recentes
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">
                <Bookmark size={14} className="mr-1" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="frequent" className="flex-1">
                <ShoppingBag size={14} className="mr-1" />
                Frequentes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
          </div>
        ) : (
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
                    recentlyViewed.map(item => renderProductCard(item))
                  ) : (
                    <div className="col-span-2 text-center py-10">
                      <Clock className="mx-auto text-gray-400 mb-3" size={40} />
                      <h3 className="text-lg font-medium text-gray-700">Nenhum produto visualizado recentemente</h3>
                      <CustomButton 
                        variant="primary" 
                        className="mt-4"
                        onClick={() => navigate('/marketplace')}
                      >
                        Ir para loja
                      </CustomButton>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {activeTab === "favorites" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium">Produtos favoritos</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {favorites.length > 0 ? (
                    favorites.map(item => renderProductCard(item))
                  ) : (
                    <div className="col-span-2 text-center py-10">
                      <Bookmark className="mx-auto text-gray-400 mb-3" size={40} />
                      <h3 className="text-lg font-medium text-gray-700">Nenhum produto favorito</h3>
                      <p className="text-gray-500 mt-1">Adicione produtos aos favoritos para encontrá-los aqui.</p>
                      <CustomButton 
                        variant="primary" 
                        className="mt-4"
                        onClick={() => navigate('/marketplace')}
                      >
                        Ir para loja
                      </CustomButton>
                    </div>
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
                    frequentlyBought.filter(item => item.produto !== null).map(item => renderProductCard(item))
                  ) : (
                    <div className="col-span-2 text-center py-10">
                      <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />
                      <h3 className="text-lg font-medium text-gray-700">Nenhum produto frequente</h3>
                      <p className="text-gray-500 mt-1">Continue comprando para construir seu histórico.</p>
                      <CustomButton 
                        variant="primary" 
                        className="mt-4"
                        onClick={() => navigate('/marketplace')}
                      >
                        Ir para loja
                      </CustomButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesScreen;
