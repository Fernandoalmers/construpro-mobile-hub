
import React from 'react';
import { Star, Check, AlertCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/services/productService';

interface ProductInfoProps {
  produto: Product;
  quantidade: number;
  handleQuantityChange: (delta: number) => void;
  handleAddToCart: () => void;
  handleToggleFavorite: () => void;
  isFavorited: boolean;
  addingToCart: boolean;
  addingToFavorites: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  produto,
  quantidade,
  handleQuantityChange,
  handleAddToCart,
  handleToggleFavorite,
  isFavorited,
  addingToCart,
  addingToFavorites
}) => {
  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);
  const stars = Math.round(produto.avaliacao || 0);
  const hasFreeShipping = (produto.preco || 0) >= 100;
  const disponibilidade = produto.estoque > 0 ? "Em estoque" : "Indisponível";
  const disponibilidadeColor = produto.estoque > 0 ? "text-green-600" : "text-red-600";

  return (
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
  );
};

export default ProductInfo;
