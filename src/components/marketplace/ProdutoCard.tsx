
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { getProductPoints } from '@/utils/pointsCalculations';
import { safeFirstImage, handleImageError } from '@/utils/imageUtils';

interface Product {
  id: string;
  nome: string;
  preco?: number; // Keep for backward compatibility
  preco_normal: number;
  preco_promocional?: number;
  categoria: string;
  imagens?: string[] | any[] | string;
  pontos_consumidor?: number;
  pontos_profissional?: number;
  estoque?: number;
  avaliacao?: number;
  loja_id?: string;
  status?: string;
  stores?: {
    id: string;
    nome: string;
    nome_loja: string;
    logo_url?: string;
  };
  vendedores?: {
    id: string;
    nome: string;
    nome_loja: string;
    logo_url?: string;
  };
  vendedor_id?: string;
}

interface ProdutoCardProps {
  produto: Product;
  className?: string;
  onClick?: () => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, className = '', onClick }) => {
  const navigate = useNavigate();
  const { addToCart, isLoading } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { profile, isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

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

  // FIXED: Calculate points correctly using specific fields
  const userType = profile?.tipo_perfil || 'consumidor';
  const displayPoints = userType === 'profissional' 
    ? (produto.pontos_profissional || 0)
    : (produto.pontos_consumidor || 0);

  // FIXED: Standardized store name logic - always use real store name
  const storeName = produto.stores?.nome_loja || 
                   produto.vendedores?.nome_loja ||
                   produto.stores?.nome || 
                   produto.vendedores?.nome;

  // FIXED: Only show store info if we have a valid store name
  const shouldShowStoreInfo = storeName && storeName.trim().length > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (produto.estoque === 0) {
      toast.error('Produto fora de estoque');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(produto.id, 1);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/produto/${produto.id}`);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // FIXED: Use correct price fields
  const hasPromotion = produto.preco_promocional && produto.preco_promocional < produto.preco_normal;
  const finalPrice = hasPromotion ? produto.preco_promocional : produto.preco_normal;
  const originalPrice = hasPromotion ? produto.preco_normal : null;

  // FIXED: Use safe image extraction from imagens field only
  const displayImageUrl = safeFirstImage(produto.imagens);

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={produto.nome}
              className="w-full h-full object-contain transition-transform duration-200 hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm"
          onClick={handleToggleFavorite}
          disabled={checkingFavorite}
        >
          <Heart 
            size={16} 
            className={`${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'} ${checkingFavorite ? 'animate-pulse' : ''}`}
          />
        </Button>

        {/* Promotion Badge */}
        {hasPromotion && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
            Promoção
          </Badge>
        )}

        {/* Out of Stock Badge */}
        {produto.estoque === 0 && (
          <Badge variant="secondary" className="absolute bottom-2 left-2">
            Fora de estoque
          </Badge>
        )}
      </div>

      <div className="p-4">
        {/* Product Name */}
        <h3 className="font-medium text-sm mb-2 line-clamp-2 h-10">
          {produto.nome}
        </h3>

        {/* Category */}
        <p className="text-xs text-gray-500 mb-2">{produto.categoria}</p>

        {/* Rating */}
        {produto.avaliacao && produto.avaliacao > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">{produto.avaliacao.toFixed(1)}</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-construPro-blue">
              {formatPrice(finalPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Store Name - STANDARDIZED - Always show when available */}
        {shouldShowStoreInfo && (
          <div className="mb-2 flex items-center gap-1">
            <Store size={12} className="text-gray-500" />
            <span className="text-xs text-gray-600">
              Vendido por {storeName}
            </span>
          </div>
        )}

        {/* Points - FIXED: Use correct points calculation */}
        {displayPoints > 0 && (
          <div className="mb-3">
            <span className="text-xs text-construPro-orange font-medium">
              +{displayPoints} pontos {userType === 'profissional' ? '(profissional)' : ''}
            </span>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0 || addingToCart || isLoading}
          className="w-full bg-construPro-orange hover:bg-orange-600 text-white text-sm h-8"
          size="sm"
        >
          {addingToCart ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adicionando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} />
              <span>Adicionar</span>
            </div>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ProdutoCard;
