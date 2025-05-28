import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, Share2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { getProductPoints } from '@/utils/pointsCalculations';
import ProductImageGallery from './components/ProductImageGallery';
import QuantitySelector from './components/QuantitySelector';
import { Product } from '@/services/productService';

interface ProdutoContentProps {
  produto: Product;
}

const ProdutoContent: React.FC<ProdutoContentProps> = ({ produto }) => {
  const navigate = useNavigate();
  const { addToCart, isLoading } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [favorited, setFavorited] = useState(false);

  console.log('Produto data:', produto);

  // Get user type for correct points calculation with type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  const displayPoints = getProductPoints(produto, validUserType);

  console.log('User type:', validUserType, 'Display points:', displayPoints);

  const handleAddToCart = async () => {
    if (produto.estoque === 0) {
      toast.error('Produto fora de estoque');
      return;
    }

    if (quantity > (produto.estoque || 0)) {
      toast.error('Quantidade indisponível em estoque');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantity);
      toast.success(`${quantity} ${quantity === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho!`);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (favorited) {
        await removeFromFavorites(produto.id);
        setFavorited(false);
        toast.success('Removido dos favoritos');
      } else {
        await addToFavorites(produto.id);
        setFavorited(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Erro ao gerenciar favoritos:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: produto.nome,
          text: produto.descricao || '',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const hasPromotion = produto.preco_promocional && produto.preco_promocional < produto.preco_normal;
  const finalPrice = hasPromotion ? produto.preco_promocional : produto.preco_normal;
  const originalPrice = hasPromotion ? produto.preco_normal : null;
  
  // Calculate discount percentage
  const discountPercentage = originalPrice && hasPromotion 
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const mainImage = produto.imagem_url || '';
  const images = produto.imagens || (mainImage ? [mainImage] : []);

  console.log('[ProdutoContent] Passing images to gallery:', {
    mainImage,
    images,
    productName: produto.nome
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <h1 className="font-medium text-lg flex-1 text-center mx-4 truncate">
            {produto.nome}
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="p-2"
            >
              <Heart 
                size={20} 
                className={`${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2"
            >
              <Share2 size={20} className="text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <ProductImageGallery 
        mainImage={mainImage}
        images={images}
        productName={produto.nome}
        hasDiscount={hasPromotion}
        discountPercentage={discountPercentage}
      />

      {/* Product Info */}
      <div className="p-4">
        {/* Category and Segment */}
        <div className="flex gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {produto.categoria}
          </Badge>
          {produto.segmento && (
            <Badge variant="outline" className="text-xs">
              {produto.segmento}
            </Badge>
          )}
        </div>

        {/* Product Name */}
        <h2 className="text-xl font-bold mb-2">{produto.nome}</h2>

        {/* Price Section */}
        <div className="mb-4">
          {hasPromotion && (
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                {discountPercentage}% OFF
              </Badge>
            </div>
          )}
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-construPro-blue">
              {formatPrice(finalPrice)}
            </span>
            {originalPrice && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          
          {produto.unidade_medida && (
            <p className="text-sm text-gray-600 mt-1">
              por {produto.unidade_medida}
            </p>
          )}
        </div>

        {/* Points */}
        {displayPoints > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-construPro-orange" />
              <span className="text-sm font-medium text-construPro-orange">
                +{displayPoints} pontos {validUserType === 'profissional' ? '(profissional)' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Ganhe pontos ao comprar este produto
            </p>
          </div>
        )}

        {/* Stock Status */}
        <div className="mb-4">
          {produto.estoque === 0 ? (
            <Badge variant="destructive">Fora de estoque</Badge>
          ) : produto.estoque && produto.estoque <= 5 ? (
            <Badge variant="secondary">
              Apenas {produto.estoque} em estoque
            </Badge>
          ) : (
            <Badge className="bg-green-500 hover:bg-green-600">
              Em estoque
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        {/* Quantity and Add to Cart */}
        {produto.estoque && produto.estoque > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Quantidade:</span>
              <QuantitySelector
                produto={produto}
                quantidade={quantity}
                onQuantityChange={(delta) => {
                  const newQuantity = quantity + delta;
                  if (newQuantity >= 1 && newQuantity <= (produto.estoque || 1)) {
                    setQuantity(newQuantity);
                  }
                }}
              />
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || isLoading}
              className="w-full bg-construPro-orange hover:bg-orange-600 text-white h-12"
            >
              {addingToCart ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adicionando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  <span>Adicionar ao carrinho</span>
                </div>
              )}
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        {/* Product Description */}
        {produto.descricao && (
          <div className="mb-6">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Info size={16} />
              Descrição
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {produto.descricao}
            </p>
          </div>
        )}

        {/* Product Details */}
        <div className="space-y-3">
          <h3 className="font-medium">Detalhes do produto</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {produto.sku && (
              <div>
                <span className="text-gray-600">SKU:</span>
                <span className="ml-2 font-medium">{produto.sku}</span>
              </div>
            )}
            
            {produto.codigo_barras && (
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-medium">{produto.codigo_barras}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-600">Categoria:</span>
              <span className="ml-2 font-medium">{produto.categoria}</span>
            </div>
            
            {produto.segmento && (
              <div>
                <span className="text-gray-600">Segmento:</span>
                <span className="ml-2 font-medium">{produto.segmento}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-20"></div>
    </div>
  );
};

export default ProdutoContent;
