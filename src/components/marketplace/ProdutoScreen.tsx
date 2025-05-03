import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Star, Truck, ShoppingCart, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { getProductById, trackProductView, Product } from '@/services/productService';
import { addToCart } from '@/services/cartService';
import { addToFavorites, isProductFavorited } from '@/services/favoriteService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

const ProdutoScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [produto, setProduto] = useState<Product | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToFavorites, setAddingToFavorites] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await getProductById(id);
        
        if (!productData) {
          setError('Produto não encontrado');
          return;
        }
        
        setProduto(productData);
        
        // Track product view
        if (isAuthenticated) {
          trackProductView(id);
        }
        
        // Check if favorited
        if (isAuthenticated) {
          const favorited = await isProductFavorited(id);
          setIsFavorited(favorited);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Erro ao carregar detalhes do produto');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, isAuthenticated]);

  const handleQuantityChange = (delta: number) => {
    const newValue = quantidade + delta;
    if (newValue >= 1 && newValue <= (produto?.estoque || 1)) {
      setQuantidade(newValue);
    }
  };

  const handleAddToCart = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
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

  const handleToggleFavorite = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    try {
      setAddingToFavorites(true);
      if (!isFavorited) {
        const result = await addToFavorites(produto.id);
        
        if (result) {
          setIsFavorited(true);
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

  if (loading) {
    return <LoadingState text="Carregando detalhes do produto..." />;
  }

  if (error || !produto) {
    return (
      <ErrorState 
        title="Erro ao carregar produto" 
        message={error || "Produto não encontrado"}
        onRetry={() => navigate('/marketplace')}
      />
    );
  }

  const disponibilidade = produto.estoque > 0 ? "Em estoque" : "Indisponível";
  const disponibilidadeColor = produto.estoque > 0 ? "text-green-600" : "text-red-600";
  const stars = Math.round(produto.avaliacao);

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2" /> Voltar
          </Button>
          <h1 className="text-lg font-semibold">Detalhes do Produto</h1>
          <div>
            {/* Future: Add cart and profile icons here */}
          </div>
        </div>
      </header>

      <main className="container mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
        <section className="mb-6">
          <img
            src={produto.imagem_url || 'https://via.placeholder.com/400'}
            alt={produto.nome}
            className="w-full h-96 object-contain rounded-md"
          />
          <h2 className="text-2xl font-bold mt-4">{produto.nome}</h2>
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < stars ? 'text-yellow-500' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-2 text-gray-700">{produto.avaliacao?.toFixed(1)}</span>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Preço: R$ {produto.preco?.toFixed(2)}</h3>
          <p className={`font-bold ${disponibilidadeColor}`}>{disponibilidade}</p>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Descrição</h3>
          <p className="text-gray-800">{produto.descricao || 'Sem descrição disponível'}</p>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Quantidade</h3>
          <div className="flex items-center">
            <Button variant="outline" onClick={() => handleQuantityChange(-1)} disabled={quantidade <= 1}>
              -
            </Button>
            <span className="mx-4">{quantidade}</span>
            <Button variant="outline" onClick={() => handleQuantityChange(1)} disabled={quantidade >= (produto.estoque || 1)}>
              +
            </Button>
          </div>
        </section>

        <section className="flex justify-between items-center">
          <Button
            className="bg-green-500 text-white rounded-full px-6 py-3 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            onClick={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2" />
                Adicionar ao Carrinho
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            onClick={handleToggleFavorite}
            disabled={addingToFavorites}
          >
            {addingToFavorites ? (
              <>
                <div className="animate-pulse">
                  <Heart fill="red" className="mr-2" />
                  Favoritando...
                </div>
              </>
            ) : (
              <>
                <Heart className="mr-2" fill={isFavorited ? 'red' : 'none'} />
                {isFavorited ? 'Desfavoritar' : 'Favoritar'}
              </>
            )}
          </Button>
        </section>
      </main>

      <footer className="container mx-auto mt-8 p-4 bg-gray-200 rounded-lg shadow-md text-center">
        <p>
          <Truck className="inline-block mr-2" />
          Entrega rápida e segura em todo o Brasil
        </p>
        <p>
          <Shield className="inline-block mr-2" />
          Compra garantida ou seu dinheiro de volta
        </p>
      </footer>
    </div>
  );
};

export default ProdutoScreen;
