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
  preco_normal: number;
  preco_promocional?: number;
  imagens: any;
  categoria: string;
  descricao: string;
  vendedor_id?: string;
  loja_nome?: string;
}

interface RecentlyViewed {
  id: string;
  user_id: string;
  produto_id: string;
  data_visualizacao: string;
  produtos: Product;
}

interface FavoriteItem {
  id: string;
  user_id: string;
  produto_id: string;
  data_adicionado: string;
  produtos: Product;
}

interface FrequentlyBoughtItem {
  produto_id: string;
  count: number;
  produtos: Product | null;
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
          produtos:produto_id (
            id, nome, preco_normal, preco_promocional, imagens, categoria, descricao,
            vendedor_id
          )
        `)
        .eq('user_id', user?.id || '')
        .order('data_visualizacao', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching recently viewed:', error);
        throw error;
      }
      
      // Fetch store names for products that have vendedor_id
      const productsWithVendorId = (data || [])
        .filter(item => item.produtos && item.produtos.vendedor_id)
        .map(item => item.produtos.vendedor_id)
        .filter(Boolean);
      
      if (productsWithVendorId.length > 0) {
        const vendedorIds = [...new Set(productsWithVendorId)];
        
        const { data: vendedores, error: vendedoresError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendedorIds);
        
        if (!vendedoresError && vendedores) {
          const vendedorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome_loja]));
          
          return (data || []).map(item => ({
            ...item,
            produtos: item.produtos ? {
              ...item.produtos,
              loja_nome: item.produtos.vendedor_id ? vendedorMap[item.produtos.vendedor_id] : undefined
            } : null
          }));
        }
      }
      
      return data || [];
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
      console.log('Fetching favorites for user:', user?.id);
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          produtos:produto_id (
            id, nome, preco_normal, preco_promocional, imagens, categoria, descricao,
            vendedor_id
          )
        `)
        .eq('user_id', user?.id || '');
      
      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }
      
      console.log('Raw favorites data:', data);
      
      // Fetch store names for products that have vendedor_id
      const productsWithVendorId = (data || [])
        .filter(item => item.produtos && item.produtos.vendedor_id)
        .map(item => item.produtos.vendedor_id)
        .filter(Boolean);
      
      if (productsWithVendorId.length > 0) {
        const vendedorIds = [...new Set(productsWithVendorId)];
        
        const { data: vendedores, error: vendedoresError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendedorIds);
        
        if (!vendedoresError && vendedores) {
          const vendedorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome_loja]));
          
          const result = (data || []).map(item => ({
            ...item,
            produtos: item.produtos ? {
              ...item.produtos,
              loja_nome: item.produtos.vendedor_id ? vendedorMap[item.produtos.vendedor_id] : undefined
            } : null
          }));
          
          console.log('Processed favorites data:', result);
          return result;
        }
      }
      
      return data || [];
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
          .select('produto_id, quantidade')
          .eq('order_id', user?.id || '');
          
        if (orderItemsError) throw orderItemsError;
        
        if (orderItems && orderItems.length > 0) {
          const productMap: Record<string, number> = {};
          
          orderItems.forEach(item => {
            if (item.produto_id) {
              if (!productMap[item.produto_id]) {
                productMap[item.produto_id] = 0;
              }
              productMap[item.produto_id] += item.quantidade || 1;
            }
          });
          
          const aggregatedItems = Object.entries(productMap).map(([produto_id, count]) => ({
            produto_id,
            count
          }));
          
          const topItems = aggregatedItems
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
          
          const productIds = topItems.map(item => item.produto_id);
          
          if (productIds.length === 0) return [];
          
          const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select(`
              id, nome, preco_normal, preco_promocional, imagens, categoria, descricao, 
              vendedor_id
            `)
            .in('id', productIds);
          
          if (productsError) throw productsError;
          
          const enrichedItems = topItems.map(item => {
            const matchingProduct = (products || []).find(p => p.id === item.produto_id) || null;
            return {
              produto_id: item.produto_id,
              count: item.count,
              produtos: matchingProduct
            };
          }).filter(item => item.produtos !== null);
          
          const vendedorIds = enrichedItems
            .filter(item => item.produtos && item.produtos.vendedor_id)
            .map(item => item.produtos?.vendedor_id)
            .filter(Boolean) as string[];
          
          if (vendedorIds.length > 0) {
            const { data: vendedores, error: vendedoresError } = await supabase
              .from('vendedores')
              .select('id, nome_loja')
              .in('id', vendedorIds);
            
            if (!vendedoresError && vendedores) {
              const vendedorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome_loja]));
              
              return enrichedItems.map(item => ({
                ...item,
                produtos: item.produtos ? {
                  ...item.produtos,
                  loja_nome: item.produtos.vendedor_id ? vendedorMap[item.produtos.vendedor_id] : undefined
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
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Produto removido dos favoritos');
    },
    onError: (error) => {
      console.error('Remove favorite mutation error:', error);
      toast.error(`Erro ao remover favorito: ${error}`);
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
  
  const getProductPrice = (product: Product) => {
    return product.preco_promocional || product.preco_normal;
  };

  const getProductImageUrl = (product: Product) => {
    if (product.imagens) {
      if (typeof product.imagens === 'string') {
        try {
          const parsed = JSON.parse(product.imagens);
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder.svg';
        } catch {
          return product.imagens;
        }
      }
      if (Array.isArray(product.imagens) && product.imagens.length > 0) {
        return product.imagens[0];
      }
    }
    return '/placeholder.svg';
  };
  
  // Render a product card
  const renderProductCard = (item: RecentlyViewed | FavoriteItem | FrequentlyBoughtItem) => {
    if (!('id' in item)) {
      if (!item.produtos) return null;
      
      const product = item.produtos;
      
      return (
        <Card key={`frequent-${item.produto_id}`} className="overflow-hidden">
          <div 
            className="h-40 bg-center bg-cover cursor-pointer"
            style={{ backgroundImage: `url(${getProductImageUrl(product)})` }}
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
                <span className="text-xs ml-1">4.5</span>
              </div>
              <span className="text-xs ml-2 text-gray-500">Comprado {item.count}x</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-construPro-blue">
                R$ {getProductPrice(product).toFixed(2)}
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
    
    if (!item.produtos) return null;
    
    const product = item.produtos;
    const isFavoriteTab = activeTab === "favorites";
    
    return (
      <Card key={item.id} className="overflow-hidden relative">
        {isFavoriteTab && (
          <button 
            className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md"
            onClick={() => handleRemoveFavorite(item.id)}
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        )}
        <div 
          className="h-40 bg-center bg-cover cursor-pointer"
          style={{ backgroundImage: `url(${getProductImageUrl(product)})` }}
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
              <span className="text-xs ml-1">4.5</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-construPro-blue">
              R$ {getProductPrice(product).toFixed(2)}
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

  const isLoading = 
    (activeTab === "recent" && isLoadingRecent) || 
    (activeTab === "favorites" && isLoadingFavorites) || 
    (activeTab === "frequent" && isLoadingFrequent);

  if (recentError || favoritesError || frequentError) {
    const error = recentError || favoritesError || frequentError;
    console.error('Query error:', error);
    toast.error(`Erro ao carregar dados: ${(error as Error).message}`);
  }

  console.log('Current favorites data:', favorites);
  console.log('Active tab:', activeTab);
  console.log('Is loading favorites:', isLoadingFavorites);

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
                  <h2 className="font-medium">Produtos favoritos ({favorites.length})</h2>
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
                    frequentlyBought.filter(item => item.produtos !== null).map(item => renderProductCard(item))
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
