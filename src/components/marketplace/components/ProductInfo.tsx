
import React from 'react';
import { Star, Check, AlertCircle, Truck, ShoppingCart, MessageSquare, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productService';
import { Card, CardContent } from '@/components/ui/card';

interface ProductInfoProps {
  produto: Product;
  quantidade: number;
  handleQuantityChange: (delta: number) => void;
  handleAddToCart: () => void;
  handleBuyNow?: () => void;
  handleToggleFavorite: () => void;
  handleChatWithStore?: () => void;
  isFavorited: boolean;
  addingToCart: boolean;
  addingToFavorites: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  produto,
  quantidade,
  handleQuantityChange,
  handleAddToCart,
  handleBuyNow,
  handleToggleFavorite,
  handleChatWithStore,
  isFavorited,
  addingToCart,
  addingToFavorites
}) => {
  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);
  const stars = Math.round(produto.avaliacao || 0);
  const hasFreeShipping = (produto.preco || 0) >= 100;
  const disponibilidade = produto.estoque > 0 ? "Em estoque" : "Indisponível";
  const disponibilidadeColor = produto.estoque > 0 ? "text-green-600" : "text-red-600";
  
  // Calculate discount percentage
  const discountPercentage = hasDiscount 
    ? Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)
    : 0;
  
  // Calculate estimated delivery
  const today = new Date();
  const deliveryDate = new Date();
  deliveryDate.setDate(today.getDate() + 4);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Store info */}
      {produto.stores && (
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center mr-3">
            {produto.stores.logo_url ? (
              <img src={produto.stores.logo_url} alt={produto.stores.nome} className="w-full h-full object-cover" />
            ) : (
              <ShoppingCart size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Vendido por:</p>
            <h3 className="font-medium">{produto.stores.nome}</h3>
          </div>
        </div>
      )}
    
      <h1 className="text-2xl font-bold mb-2">{produto.nome}</h1>
      
      {/* Product code */}
      <div className="text-sm text-gray-500 mb-3">
        Código: {produto.id.substring(0, 8)}
      </div>
      
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
          {produto.avaliacao?.toFixed(1) || "0.0"} ({produto.num_avaliacoes || 0} avaliações)
        </span>
      </div>
      
      {/* Price */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
        {hasDiscount && (
          <div className="flex items-center mb-1">
            <div className="text-sm text-gray-500 line-through">
              R$ {produto.preco_anterior?.toFixed(2)}
            </div>
            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              {discountPercentage}% OFF
            </span>
          </div>
        )}
        <div className="flex items-center">
          <span className="text-3xl font-bold text-blue-700">
            R$ {produto.preco?.toFixed(2)}
          </span>
        </div>
        
        {/* Payment methods info */}
        <div className="text-sm text-gray-600 mt-1">
          Em até 12x sem juros
        </div>
      </div>
      
      {/* Points */}
      <Card className="mb-4">
        <CardContent className="p-3 flex items-center">
          <Star size={18} className="text-construPro-orange mr-2" />
          <div>
            <p className="text-sm font-medium">Ganhe pontos com essa compra</p>
            <div className="flex gap-2 text-xs mt-1">
              <span className="px-1.5 py-0.5 bg-construPro-orange/10 rounded text-construPro-orange">
                {produto.pontos || produto.pontos_consumidor || 0} pts (consumidor)
              </span>
              <span className="px-1.5 py-0.5 bg-construPro-blue/10 rounded text-construPro-blue">
                {Math.round((produto.pontos || produto.pontos_consumidor || 0) * 1.5)} pts (profissional)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Shipping & Stock */}
      <div className="mb-6 space-y-3">
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
        
        {/* Estimated delivery */}
        <div className="flex items-center text-gray-600">
          <Clock size={18} className="mr-2" />
          <span>Chegará entre <span className="font-medium">hoje</span> e <span className="font-medium">{formatDate(deliveryDate)}</span></span>
        </div>
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
          
          <div className="ml-3 text-sm text-gray-500">
            {produto.unidade_medida && (
              <span>Unidade: {produto.unidade_medida}</span>
            )}
          </div>
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
        
        {handleBuyNow && (
          <Button
            className="bg-construPro-blue hover:bg-blue-700 text-white py-3 rounded-full"
            onClick={handleBuyNow}
            disabled={addingToCart || produto.estoque <= 0}
          >
            <span>Comprar agora</span>
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border border-blue-500 text-blue-500 hover:bg-blue-50 py-3 rounded-full flex-1"
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
                <span>{isFavorited ? "Salvo" : "Favoritar"}</span>
              </div>
            )}
          </Button>
          
          {handleChatWithStore && (
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-full flex-1"
              onClick={handleChatWithStore}
            >
              <div className="flex items-center justify-center">
                <MessageSquare className="mr-2" />
                <span>Chat com loja</span>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
