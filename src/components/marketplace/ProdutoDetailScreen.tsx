import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Star, Truck, Shield, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';
import { cartService } from '@/services/cartService';

const ProdutoDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartCount } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  
  // For now, using static data
  const produto = produtos.find(p => p.id === id);
  const loja = produto ? lojas.find(l => l.id === produto.lojaId) : undefined;
  
  useEffect(() => {
    if (!produto) {
      toast.error("Produto não encontrado");
      navigate('/marketplace');
    }
  }, [produto, navigate]);

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrementQuantity = () => {
    const maxQuantity = produto?.estoque || 0;
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Quantidade máxima disponível: ${maxQuantity}`);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantity);
      toast.success("Produto adicionado ao carrinho!");
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast.error("Não foi possível adicionar o produto ao carrinho");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      setAddingToFavorites(true);
      // Existing code for adding to favorites
      await cartService.addToFavorites(produto.id);
      toast.success("Adicionado aos favoritos!");
    } catch (error) {
      console.error("Erro ao adicionar aos favoritos:", error);
      toast.error("Não foi possível adicionar aos favoritos");
    } finally {
      setAddingToFavorites(false);
    }
  };

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (loading || !produto || !loja) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-medium">Carregando produto...</h1>
        </div>
        <div className="p-6">
          <div className="h-[300px] bg-gray-200 animate-pulse rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded-md mb-2 w-3/4"></div>
          <div className="h-6 bg-gray-200 animate-pulse rounded-md mb-8 w-1/2"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded-md mb-4 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header with search and cart */}
      <div className="bg-white p-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex-shrink-0">
            <ArrowLeft size={22} />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 mx-2">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none"
            />
          </form>
          
          <button 
            onClick={() => navigate('/cart')} 
            className="relative flex-shrink-0"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="w-full h-[300px] bg-white">
        <img 
          src={produto.imagemUrl} 
          alt={produto.nome} 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Product Info */}
      <div className="bg-white p-6">
        {/* Store Info */}
        <div className="flex items-center mb-3">
          <img 
            src={loja.logoUrl} 
            alt={loja.nome} 
            className="w-5 h-5 rounded-full object-cover mr-2"
          />
          <span className="text-sm text-gray-600">{loja.nome}</span>
        </div>

        <h1 className="text-xl font-bold">{produto.nome}</h1>
        
        {/* Rating */}
        <div className="flex items-center mt-1 mb-4">
          <Star size={18} className="fill-yellow-400 text-yellow-400" />
          <span className="ml-1 font-medium">{produto.avaliacao}</span>
          <span className="mx-1 text-gray-400">•</span>
          <span className="text-sm text-gray-500">
            {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
          </span>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-construPro-blue">
              R$ {produto.preco.toFixed(2)}
            </span>
            {'precoAnterior' in produto && (
              <span className="text-sm line-through text-gray-400">
                R$ {(produto as any).precoAnterior.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="mt-1 bg-construPro-orange/10 text-construPro-orange px-2 py-1 rounded-md inline-block">
            <span className="text-sm font-medium">
              Ganhe {produto.pontos} pontos
            </span>
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Quantidade</p>
          <div className="flex items-center w-1/3">
            <button
              onClick={handleDecrementQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50"
            >
              <Minus size={16} />
            </button>
            <div className="h-10 flex-1 flex items-center justify-center border-t border-b border-gray-300 bg-white">
              {quantity}
            </div>
            <button
              onClick={handleIncrementQuantity}
              disabled={quantity >= (produto.estoque || 0)}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={handleAddToCart}
            className="flex-1 bg-construPro-blue hover:bg-construPro-blue/90"
            disabled={addingToCart}
          >
            {addingToCart ? "Adicionando..." : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" /> 
                Adicionar ao Carrinho
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="px-4"
            onClick={handleAddToFavorites}
            disabled={addingToFavorites}
          >
            <Heart className={addingToFavorites ? "animate-pulse" : ""} />
          </Button>
        </div>
        
        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-700">
            <Truck size={16} className="mr-2 text-construPro-blue" />
            <span>Entrega em até 7 dias úteis</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Shield size={16} className="mr-2 text-construPro-blue" />
            <span>Garantia de 90 dias</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Clock size={16} className="mr-2 text-construPro-blue" />
            <span>Devolução em até 7 dias</span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="bg-white mt-2 p-6">
        <h2 className="text-lg font-bold mb-3">Descrição</h2>
        <p className="text-gray-700">
          {produto.descricao}
        </p>
      </div>
      
      {/* Specifications */}
      <div className="bg-white mt-2 p-6">
        <h2 className="text-lg font-bold mb-3">Especificações</h2>
        <ul className="space-y-2">
          {'especificacoes' in produto && Array.isArray((produto as any).especificacoes) && (
            (produto as any).especificacoes.map((spec: string, index: number) => (
              <li key={index} className="text-gray-700 text-sm py-1 border-b border-gray-100">
                {spec}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProdutoDetailScreen;
