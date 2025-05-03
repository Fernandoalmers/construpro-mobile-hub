
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Star, Truck, Shield, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cartService } from '@/services/cartService';
import { supabase } from '@/integrations/supabase/client';

const ProdutoDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartCount, refreshCart } = useCart();
  
  const [produto, setProduto] = useState<any>(null);
  const [loja, setLoja] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Get product from Supabase
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        if (!productData) {
          toast.error("Produto não encontrado");
          navigate('/marketplace');
          return;
        }
        
        setProduto(productData);
        
        // Get store information
        if (productData.loja_id) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', productData.loja_id)
            .single();
          
          setLoja(storeData);
        }
        
        // Add to recently viewed
        if (isAuthenticated) {
          await supabase
            .from('recently_viewed')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              produto_id: id
            })
            .select();
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Erro ao carregar o produto");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
    refreshCart();
  }, [id, navigate, isAuthenticated, refreshCart]);

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrementQuantity = () => {
    const maxQuantity = produto?.estoque || 0;
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Quantidade máxima disponível: ${maxQuantity}`);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantity);
      toast.success("Produto adicionado ao carrinho!");
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast.error("Não foi possível adicionar o produto ao carrinho");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantity);
      navigate('/checkout');
    } catch (error) {
      console.error("Erro ao processar compra:", error);
      toast.error("Não foi possível processar sua compra");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      setAddingToFavorites(true);
      await cartService.addToFavorites(produto.id);
      toast.success("Adicionado aos favoritos!");
    } catch (error) {
      console.error("Erro ao adicionar aos favoritos:", error);
      toast.error("Não foi possível adicionar aos favoritos");
    } finally {
      setAddingToFavorites(false);
    }
  };

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, nome, preco, imagem_url')
        .ilike('nome', `%${query}%`)
        .limit(5);
        
      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };
  
  const handleSearchItemClick = (productId: string) => {
    navigate(`/produto/${productId}`);
    setShowResults(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-medium">Carregando produto...</h1>
        </div>
        <div className="p-6">
          <div className="h-[300px] bg-gray-200 animate-pulse rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded-md mb-2 w-3/4"></div>
          <div className="h-6 bg-gray-200 animate-pulse rounded-md mb-8 w-1/2"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded-md mb-4 w-full"></div>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-medium">Produto não encontrado</h1>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4">O produto que você está procurando não está disponível.</p>
          <Button 
            onClick={() => navigate('/marketplace')}
            className="bg-construPro-blue"
          >
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header with search and cart */}
      <div className="bg-white p-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex-shrink-0">
            <ArrowLeft size={22} />
          </button>
          
          <div className="flex-1 mx-2 relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none"
            />
            
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => handleSearchItemClick(product.id)}
                  >
                    <div className="flex items-center">
                      {product.imagem_url && (
                        <img 
                          src={product.imagem_url} 
                          alt={product.nome} 
                          className="w-10 h-10 object-cover rounded-sm mr-2"
                        />
                      )}
                      <div>
                        <p className="text-sm line-clamp-1">{product.nome}</p>
                        <p className="text-xs font-bold">R$ {product.preco.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/cart')} 
            className="relative flex-shrink-0"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="w-full h-[300px] bg-white">
        <img 
          src={produto.imagem_url || produto.imagemUrl} 
          alt={produto.nome} 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Product Info */}
      <div className="bg-white p-6">
        {/* Store Info */}
        {loja && (
          <div className="flex items-center mb-3">
            <img 
              src={loja.logo_url} 
              alt={loja.nome} 
              className="w-5 h-5 rounded-full object-cover mr-2"
            />
            <span className="text-sm text-gray-600">{loja.nome}</span>
          </div>
        )}

        <h1 className="text-xl font-bold">{produto.nome}</h1>
        
        {/* Rating */}
        <div className="flex items-center mt-1 mb-4">
          <Star size={18} className="fill-yellow-400 text-yellow-400" />
          <span className="ml-1 font-medium">{produto.avaliacao}</span>
          <span className="mx-1 text-gray-400">•</span>
          <span className="text-sm text-gray-500">
            {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
          </span>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-construPro-blue">
              R$ {produto.preco.toFixed(2)}
            </span>
            {(produto.precoAnterior > produto.preco || produto.preco_anterior > produto.preco) && (
              <span className="text-sm line-through text-gray-400">
                R$ {(produto.precoAnterior || produto.preco_anterior).toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="mt-1 bg-construPro-orange/10 text-construPro-orange px-2 py-1 rounded-md inline-block">
            <span className="text-sm font-medium">
              Ganhe {produto.pontos} pontos
            </span>
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Quantidade</p>
          <div className="flex items-center w-1/3">
            <button
              onClick={handleDecrementQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50"
            >
              <Minus size={16} />
            </button>
            <div className="h-10 flex-1 flex items-center justify-center border-t border-b border-gray-300 bg-white">
              {quantity}
            </div>
            <button
              onClick={handleIncrementQuantity}
              disabled={quantity >= (produto.estoque || 0)}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={handleAddToCart}
            className="flex-1 bg-construPro-blue hover:bg-construPro-blue/90"
            disabled={addingToCart}
          >
            {addingToCart ? "Adicionando..." : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" /> 
                Adicionar ao Carrinho
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleBuyNow}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={addingToCart}
          >
            Comprar Agora
          </Button>
          
          <Button 
            variant="outline" 
            className="px-4"
            onClick={handleAddToFavorites}
            disabled={addingToFavorites}
          >
            <Heart className={addingToFavorites ? "animate-pulse" : ""} />
          </Button>
        </div>
        
        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-700">
            <Truck size={16} className="mr-2 text-construPro-blue" />
            <span>Entrega em até 7 dias úteis</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Shield size={16} className="mr-2 text-construPro-blue" />
            <span>Garantia de 90 dias</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Clock size={16} className="mr-2 text-construPro-blue" />
            <span>Devolução em até 7 dias</span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="bg-white mt-2 p-6">
        <h2 className="text-lg font-bold mb-3">Descrição</h2>
        <p className="text-gray-700">
          {produto.descricao}
        </p>
      </div>
      
      {/* Specifications */}
      <div className="bg-white mt-2 p-6">
        <h2 className="text-lg font-bold mb-3">Especificações</h2>
        <ul className="space-y-2">
          {'especificacoes' in produto && Array.isArray(produto.especificacoes) && (
            produto.especificacoes.map((spec: string, index: number) => (
              <li key={index} className="text-gray-700 text-sm py-1 border-b border-gray-100">
                {spec}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProdutoDetailScreen;
