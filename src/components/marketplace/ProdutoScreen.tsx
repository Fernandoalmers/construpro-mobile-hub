
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getProductById, trackProductView, Product } from '@/services/productService';
import { addToCart } from '@/services/cartService';
import { addToFavorites, isProductFavorited } from '@/services/cartService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

// Import our new components
import ProductBreadcrumbs from './components/ProductBreadcrumbs';
import ProductImageGallery from './components/ProductImageGallery';
import ProductInfo from './components/ProductInfo';
import ProductDetails from './components/ProductDetails';

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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

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

  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);
  const discountPercentage = hasDiscount 
    ? Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)
    : 0;

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      {/* Breadcrumb navigation */}
      <ProductBreadcrumbs productName={produto.nome} productCategory={produto.categoria} />

      <main className="container mx-auto mt-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image Section */}
          <ProductImageGallery
            mainImage={produto.imagem_url || ''}
            images={produto.imagens}
            productName={produto.nome}
            hasDiscount={hasDiscount}
            discountPercentage={discountPercentage}
          />

          {/* Product Info Section */}
          <ProductInfo
            produto={produto}
            quantidade={quantidade}
            handleQuantityChange={handleQuantityChange}
            handleAddToCart={handleAddToCart}
            handleToggleFavorite={handleToggleFavorite}
            isFavorited={isFavorited}
            addingToCart={addingToCart}
            addingToFavorites={addingToFavorites}
          />
        </div>
        
        {/* Product Description and Policies */}
        <ProductDetails description={produto.descricao} />
        
        {/* Back button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para os produtos
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProdutoScreen;
