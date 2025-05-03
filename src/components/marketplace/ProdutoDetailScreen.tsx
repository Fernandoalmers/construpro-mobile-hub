import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Star, Truck, Shield, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { addToCart, addToFavorites } from '@/services/cartService';
import { supabase } from '@/integrations/supabase/client';

const ProdutoDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart: addItemToCart, cartCount, refreshCart } = useCart();
  
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
      await addItemToCart(produto.id, quantity);
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
      await addItemToCart(produto.id, quantity);
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
      await addToFavorites(produto.id);
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

  return (
    <div>Product Detail Screen</div>
  );
};

export default ProdutoDetailScreen;
