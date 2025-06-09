
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Trash2 } from 'lucide-react';
import Card from '../../common/Card';
import CustomButton from '../../common/CustomButton';

interface Product {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number;
  imagens: any;
  categoria: string;
  descricao: string;
  vendedor_id?: string;
  loja_nome?: string;
}

interface ProductCardProps {
  item: {
    id?: string;
    produto_id?: string;
    count?: number;
    produtos: Product;
  };
  showRemoveButton?: boolean;
  onRemove?: (id: string) => void;
  onAddToCart: (productId: string, productName: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  item, 
  showRemoveButton = false, 
  onRemove, 
  onAddToCart 
}) => {
  const navigate = useNavigate();
  
  const getProductPrice = (product: Product) => {
    return product.preco_promocional || product.preco_normal;
  };

  const getProductImageUrl = (product: Product) => {
    if (product.imagens) {
      if (typeof product.imagens === 'string') {
        try {
          const parsed = JSON.parse(product.imagens);
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder.svg';
        } catch {
          return product.imagens;
        }
      }
      if (Array.isArray(product.imagens) && product.imagens.length > 0) {
        return product.imagens[0];
      }
    }
    return '/placeholder.svg';
  };

  if (!item.produtos) return null;
  
  const product = item.produtos;
  const cardKey = item.id || `frequent-${item.produto_id}`;
  
  return (
    <Card key={cardKey} className="overflow-hidden relative">
      {showRemoveButton && item.id && onRemove && (
        <button 
          className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md"
          onClick={() => onRemove(item.id!)}
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      )}
      <div 
        className="h-40 bg-center bg-cover cursor-pointer"
        style={{ backgroundImage: `url(${getProductImageUrl(product)})` }}
        onClick={() => navigate(`/marketplace/produto/${product.id}`)}
      />
      <div className="p-3">
        <h3 className="font-medium truncate">{product.nome}</h3>
        {product.loja_nome && (
          <p className="text-xs text-gray-500">{product.loja_nome}</p>
        )}
        <div className="flex items-center mt-1 mb-2">
          <div className="flex items-center">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs ml-1">4.5</span>
          </div>
          {item.count && (
            <span className="text-xs ml-2 text-gray-500">Comprado {item.count}x</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-bold text-construPro-blue">
            R$ {getProductPrice(product).toFixed(2)}
          </span>
          
          <CustomButton
            variant="primary"
            size="sm"
            onClick={() => onAddToCart(product.id, product.nome)}
            icon={<ShoppingBag size={14} />}
          >
            Comprar
          </CustomButton>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
