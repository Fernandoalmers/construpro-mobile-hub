
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Star, Truck, ShoppingCart, ArrowLeft, Check, AlertCircle, Shield as ShieldIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getProductById, trackProductView, Product } from '@/services/productService';
import { addToCart } from '@/services/cartService';
import { addToFavorites, isProductFavorited } from '@/services/cartService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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

  const disponibilidade = produto.estoque > 0 ? "Em estoque" : "Indisponível";
  const disponibilidadeColor = produto.estoque > 0 ? "text-green-600" : "text-red-600";
  const stars = Math.round(produto.avaliacao || 0);
  const hasFreeShipping = (produto.preco || 0) >= 100;
  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      <div className="bg-white shadow-sm">
        {/* Breadcrumb navigation */}
        <div className="container mx-auto py-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/marketplace">Marketplace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to={`/marketplace?categoria=${produto.categoria}`}>
                  {produto.categoria}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <span className="truncate max-w-[200px] inline-block">{produto.nome}</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="container mx-auto mt-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="aspect-square relative">
              <img
                src={produto.imagem_url || 'https://via.placeholder.com/400'}
                alt={produto.nome}
                className="w-full h-full object-contain rounded-md"
              />
              {hasDiscount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold rounded-md px-2 py-1">
                  {Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Image thumbnails would go here (if multiple images) */}
            <div className="flex mt-4 gap-2 overflow-x-auto pb-2">
              {produto.imagens && produto.imagens.map((url, index) => (
                <div 
                  key={index} 
                  className="w-16 h-16 border border-gray-200 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:border-blue-500"
                >
                  <img 
                    src={url} 
                    alt={`${produto.nome} - imagem ${index + 1}`} 
                    className="w-full h-full object-contain" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-2">{produto.nome}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {produto.avaliacao?.toFixed(1) || "0.0"}
              </span>
            </div>
            
            {/* Price */}
            <div className="mb-4">
              {hasDiscount && (
                <div className="text-sm text-gray-500 line-through">
                  R$ {produto.preco_anterior?.toFixed(2)}
                </div>
              )}
              <div className="flex items-center">
                <span className="text-3xl font-bold text-blue-700">
                  R$ {produto.preco?.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)}% de desconto
                  </span>
                )}
              </div>
              
              {/* Payment methods info */}
              <div className="text-sm text-gray-600 mt-1">
                Em até 12x sem juros
              </div>
            </div>
            
            {/* Shipping & Stock */}
            <div className="mb-6 space-y-2">
              <div className={`flex items-center ${disponibilidadeColor}`}>
                {produto.estoque > 0 ? (
                  <Check size={18} className="mr-2" />
                ) : (
                  <AlertCircle size={18} className="mr-2" />
                )}
                <span className="font-medium">{disponibilidade}</span>
                {produto.estoque > 0 && (
                  <span className="text-sm text-gray-600 ml-2">
                    ({produto.estoque} {produto.estoque > 1 ? 'unidades' : 'unidade'})
                  </span>
                )}
              </div>
              
              {hasFreeShipping && (
                <div className="flex items-center text-green-600">
                  <Truck size={18} className="mr-2" />
                  <span className="font-medium">Frete grátis</span>
                </div>
              )}
              
              {produto.pontos > 0 && (
                <div className="flex items-center text-orange-500">
                  <Star size={18} className="mr-2" />
                  <span className="font-medium">Ganhe {produto.pontos} pontos</span>
                </div>
              )}
            </div>
            
            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade:
              </label>
              <div className="flex items-center">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-l"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantidade <= 1}
                >
                  -
                </button>
                <span className="bg-white py-2 px-4 border-t border-b">
                  {quantidade}
                </span>
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantidade >= (produto.estoque || 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-full"
                onClick={handleAddToCart}
                disabled={addingToCart || produto.estoque <= 0}
              >
                {addingToCart ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Adicionando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ShoppingCart className="mr-2" />
                    <span>Adicionar ao carrinho</span>
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="border border-blue-500 text-blue-500 hover:bg-blue-50 py-3 rounded-full"
                onClick={handleToggleFavorite}
                disabled={addingToFavorites}
              >
                {addingToFavorites ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Heart className={`mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{isFavorited ? "Salvo nos favoritos" : "Adicionar aos favoritos"}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Product Description */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Descrição do Produto</h2>
            <p className="text-gray-700 whitespace-pre-line">{produto.descricao || 'Sem descrição disponível para este produto.'}</p>
          </CardContent>
        </Card>
        
        {/* Store info & policies */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <Truck className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Entrega rápida</h3>
                <p className="text-xs text-gray-600">Enviamos para todo o Brasil</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <ShieldIcon className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Compra Garantida</h3>
                <p className="text-xs text-gray-600">Devolução em até 7 dias</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <Star className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ganhe Pontos</h3>
                <p className="text-xs text-gray-600">Acumule e troque por produtos</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
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
