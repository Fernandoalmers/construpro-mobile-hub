
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { getProductPoints } from '@/utils/pointsCalculations';
import { UserRole } from '@/context/AuthContext';

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_normal?: number;
  preco_promocional?: number;
  categoria: string;
  imagem_url?: string;
  pontos?: number;
  pontos_consumidor?: number;
  pontos_profissional?: number;
  estoque?: number;
  avaliacao?: number;
  loja_id?: string;
  status?: string;
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
  const { profile } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Get user type for correct points calculation with type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  const displayPoints = getProductPoints(produto, validUserType);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (produto.estoque === 0) {
      toast.error('Produto fora de estoque');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(produto.id, 1);
      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const hasPromotion = produto.preco_promocional && produto.preco_promocional < (produto.preco_normal || produto.preco);
  const finalPrice = hasPromotion ? produto.preco_promocional : produto.preco;
  const originalPrice = hasPromotion ? (produto.preco_normal || produto.preco) : null;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {produto.imagem_url && !imageError ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
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
        >
          <Heart 
            size={16} 
            className={`${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
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

        {/* Points */}
        {displayPoints > 0 && (
          <div className="mb-3">
            <span className="text-xs text-construPro-orange font-medium">
              +{displayPoints} pontos {validUserType === 'profissional' ? '(profissional)' : ''}
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
