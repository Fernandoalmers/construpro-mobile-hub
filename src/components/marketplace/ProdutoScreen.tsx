
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getProductById, trackProductView, Product } from '@/services/productService';
import { addToCart } from '@/services/cartService';
import { addToFavorites, isProductFavorited } from '@/services/cartService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

// Import our components
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
  const [reviews, setReviews] = useState<any[]>([]);

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
        
        // Fetch reviews for the product
        const { data: reviewsData } = await supabase
          .from('product_reviews')
          .select(`
            id,
            cliente_id,
            nota,
            comentario,
            data,
            profiles:cliente_id (nome)
          `)
          .eq('produto_id', id)
          .order('data', { ascending: false });
        
        if (reviewsData) {
          setReviews(reviewsData.map(review => ({
            id: review.id,
            user_name: review.profiles?.nome || 'Usuário',
            rating: review.nota,
            comment: review.comentario,
            date: new Date(review.data).toLocaleDateString('pt-BR')
          })));
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
    // For products sold by m² or with specific unit requirements
    const isM2Product = produto?.unidade_medida?.toLowerCase().includes('m²') || 
                        produto?.unidade_medida?.toLowerCase().includes('m2');
    
    // Default step is 1, but for m² products we might use a custom multiple
    const step = isM2Product && produto?.unidade_medida ? parseFloat(produto.unidade_medida) || 1 : 1;
    
    const newValue = quantidade + (delta * step);
    if (newValue >= step && newValue <= (produto?.estoque || step)) {
      setQuantidade(newValue);
    }
  };

  const validateQuantity = () => {
    const isM2Product = produto?.unidade_medida?.toLowerCase().includes('m²') || 
                       produto?.unidade_medida?.toLowerCase().includes('m2');
    
    if (isM2Product && produto?.unidade_medida) {
      const step = parseFloat(produto.unidade_medida) || 1;
      // Round to the nearest multiple of step
      const roundedValue = Math.round(quantidade / step) * step;
      if (roundedValue !== quantidade) {
        setQuantidade(roundedValue);
        toast.info(`Quantidade ajustada para ${roundedValue} ${produto.unidade_medida}`);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
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
      navigate('/login', { state: { from: `/produto/${id}` } });
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
  
  const handleChatWithStore = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    // In a full implementation, this would open a chat with the store
    toast.info('Funcionalidade de chat em desenvolvimento');
  };
  
  const handleAddReview = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    // In a full implementation, this would open a review dialog
    toast.info('Funcionalidade de avaliação em desenvolvimento');
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
      <ProductBreadcrumbs 
        productName={produto.nome} 
        productCategory={produto.categoria} 
        productCode={produto.sku || produto.id.substring(0, 8)}
      />

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
            handleBuyNow={handleBuyNow}
            handleToggleFavorite={handleToggleFavorite}
            handleChatWithStore={handleChatWithStore}
            isFavorited={isFavorited}
            addingToCart={addingToCart}
            addingToFavorites={addingToFavorites}
            validateQuantity={validateQuantity}
          />
        </div>
        
        {/* Product Description and Reviews */}
        <ProductDetails 
          description={produto.descricao}
          reviews={reviews}
          canReview={isAuthenticated}
          onAddReview={handleAddReview}
        />
        
        {/* Back button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => navigate('/marketplace')}
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
