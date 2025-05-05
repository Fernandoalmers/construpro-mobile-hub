
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useCartActions } from '@/hooks/use-cart-actions';

interface ProdutoCardProps {
  produto: {
    id: string;
    nome: string;
    imagem_url?: string;
    imagens?: string[];
    preco?: number;
    preco_normal?: number;
    preco_promocional?: number;
    vendedor?: {
      id?: string;
      nome_loja?: string;
    };
    vendedor_id?: string;
    vendedores?: {
      nome_loja?: string;
    };
    estoque?: number;
  };
  onClick?: () => void;
}

export function ProdutoCard({ produto, onClick }: ProdutoCardProps) {
  const navigate = useNavigate();
  const { handleAddToCart, handleBuyNow, isAddingToCart, isBuyingNow } = useCartActions();
  
  // Determine the correct price to display
  const precoExibir = produto.preco_promocional || produto.preco_normal || produto.preco || 0;
  
  // Handle clicking on the card (navigate to product details)
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (produto.id) {
      navigate(`/produto/${produto.id}`);
    }
  };
  
  // Handle adding to cart with proper error handling
  const onAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault();
    
    if (!produto?.id) {
      toast.error('Produto inválido');
      return;
    }
    
    try {
      await handleAddToCart(produto.id, 1);
    } catch (error: any) {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };
  
  // Handle buying now with proper error handling
  const onBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault();
    
    if (!produto?.id) {
      toast.error('Produto inválido');
      return;
    }
    
    try {
      await handleBuyNow(produto.id, 1);
    } catch (error: any) {
      console.error('Erro ao comprar:', error);
    }
  };
  
  // Get seller name from the appropriate field
  const sellerName = produto.vendedor?.nome_loja || 
                    (produto.vendedores && produto.vendedores.nome_loja) || 
                    'Loja';
  
  // Get product image from the appropriate field
  const imageUrl = produto.imagem_url || (produto.imagens && produto.imagens[0]) || '';
  
  // Check if the product is out of stock
  const isOutOfStock = typeof produto.estoque === 'number' && produto.estoque <= 0;

  return (
    <div 
      onClick={handleCardClick}
      className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="relative w-full h-40 overflow-hidden bg-gray-50">
        <img 
          src={imageUrl} 
          alt={produto.nome} 
          className="w-full h-full object-cover rounded-md hover:scale-105 transition-transform"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
          }}
        />
      </div>
      
      <h3 className="text-lg font-semibold mt-2 line-clamp-2">{produto.nome}</h3>
      <p className="text-sm text-gray-500">Loja: {sellerName}</p>
      
      <p className="text-xl font-bold text-green-700 mt-1">
        R$ {precoExibir.toFixed(2)}
      </p>
      
      <div className="mt-3 flex flex-col space-y-2" onClick={e => e.stopPropagation()}>
        <Button
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
          disabled={isAddingToCart[produto.id || ''] || isOutOfStock}
          onClick={onAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isAddingToCart[produto.id || ''] ? 'Adicionando...' : 'Adicionar ao Carrinho'}
        </Button>
        
        <Button
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700"
          disabled={isBuyingNow[produto.id || ''] || isOutOfStock}
          onClick={onBuyNow}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          {isBuyingNow[produto.id || ''] ? 'Processando...' : 'Comprar Agora'}
        </Button>
        
        {isOutOfStock && (
          <p className="text-red-500 text-xs text-center">
            Produto fora de estoque
          </p>
        )}
      </div>
    </div>
  );
}

export default ProdutoCard;
