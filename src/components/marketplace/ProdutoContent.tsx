import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, Share2, Info, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { getProductPoints } from '@/utils/pointsCalculations';
import { safeFirstImage } from '@/utils/imageUtils';
import { getPromotionInfo } from '@/utils/promotionUtils';
import ProductImageGallery from './components/ProductImageGallery';
import QuantitySelector from './components/QuantitySelector';
import OfferCountdown from '@/components/common/OfferCountdown';
import { Product } from '@/services/productService';

interface ProdutoContentProps {
  produto: Product;
}

const ProdutoContent: React.FC<ProdutoContentProps> = ({ produto }) => {
  const navigate = useNavigate();
  const { addToCart, isLoading } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { profile, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

  // Get promotion info using the centralized utility
  const promotionInfo = getPromotionInfo(produto);

  // Debug logging for the specific product
  if (produto.nome?.includes('TRINCHA ATLAS')) {
    console.log('[ProdutoContent] TRINCHA ATLAS promotion info:', {
      produto: produto.nome,
      promotionInfo,
      originalData: {
        promocao_ativa: produto.promocao_ativa,
        preco_promocional: produto.preco_promocional,
        preco_normal: produto.preco_normal,
        promocao_fim: produto.promocao_fim
      }
    });
  }

  // Check if product is favorited when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated || !produto.id) return;
      
      setCheckingFavorite(true);
      try {
        const isCurrentlyFavorited = await isFavorite(produto.id);
        setFavorited(isCurrentlyFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setCheckingFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [produto.id, isAuthenticated, isFavorite]);

  // Get user type for correct points calculation with type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  const displayPoints = getProductPoints(produto, validUserType);

  // FIXED: Standardized store name logic - always use real store name
  const storeName = produto.stores?.nome_loja || 
                   produto.vendedores?.nome_loja ||
                   produto.stores?.nome || 
                   produto.vendedores?.nome;

  // FIXED: Only show store info if we have a valid store name
  const shouldShowStoreInfo = storeName && storeName.trim().length > 0;

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
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }
    
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

  // CORRECTED: Use promotion info for prices
  const finalPrice = promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice;
  const originalPrice = promotionInfo.hasActivePromotion ? promotionInfo.originalPrice : null;

  // Use safe image extraction for gallery
  const mainImage = safeFirstImage(produto.imagem_url) || '';
  const images = produto.imagens || (mainImage ? [mainImage] : []);

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
              disabled={checkingFavorite}
            >
              <Heart 
                size={20} 
                className={`${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'} ${checkingFavorite ? 'animate-pulse' : ''}`}
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
        hasDiscount={promotionInfo.hasActivePromotion}
        discountPercentage={promotionInfo.discountPercentage}
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

        {/* Store Name - STANDARDIZED - Always show when available */}
        {shouldShowStoreInfo && (
          <div className="flex items-center gap-2 mb-3">
            <Store size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">
              Vendido por <span className="font-medium text-construPro-blue">{storeName}</span>
            </span>
          </div>
        )}

        {/* Price Section - CORRECTED to use promotionInfo */}
        <div className="mb-4">
          {promotionInfo.hasActivePromotion && (
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                {promotionInfo.discountPercentage}% OFF
              </Badge>
              <OfferCountdown 
                endDate={promotionInfo.promotionEndDate}
                isActive={promotionInfo.hasActivePromotion}
                size="sm"
                variant="full"
              />
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
