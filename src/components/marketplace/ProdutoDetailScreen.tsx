
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import { ArrowLeft, ShoppingCart, Star, ChevronLeft, ChevronRight, Plus, Minus, MapPin, ChevronDown, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';

const ProdutoDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantidade, setQuantidade] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [cepModalOpen, setCepModalOpen] = useState(false);
  const [cep, setCep] = useState('01310-100'); // Default CEP
  const [cidade, setCidade] = useState('São Paulo');
  const [newCep, setNewCep] = useState('');
  const { hideHeader } = useScrollBehavior();

  const produto = produtos.find(p => p.id === id);
  const loja = produto ? lojas.find(l => l.id === produto.lojaId) : undefined;
  
  // Mock delivery dates
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 4);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!produto || !loja) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold mb-4">Produto não encontrado</h2>
        <CustomButton variant="primary" onClick={() => navigate('/marketplace')}>
          Voltar ao Marketplace
        </CustomButton>
      </div>
    );
  }

  // Mock multiple images using the same image
  const images = [
    produto.imagemUrl,
    produto.imagemUrl,
    produto.imagemUrl
  ];

  const incrementQuantidade = () => {
    if (quantidade < produto.estoque) {
      setQuantidade(quantidade + 1);
    }
  };

  const decrementQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };

  const handleComprar = () => {
    // Add to cart
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${produto.nome} foi adicionado ao seu carrinho.`,
      action: (
        <Button onClick={() => navigate('/cart')}>Ver carrinho</Button>
      )
    });
  };
  
  const handleChangeCep = () => {
    setCepModalOpen(true);
  };

  const confirmCepChange = () => {
    if (newCep && newCep.length >= 8) {
      setCep(newCep);
      // Mock city update based on CEP
      const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba'];
      setCidade(cities[Math.floor(Math.random() * cities.length)]);
      setCepModalOpen(false);
      toast({
        title: "CEP atualizado",
        description: `Seu CEP foi atualizado para ${newCep}.`,
      });
    } else {
      toast({
        title: "CEP inválido",
        description: "Por favor, digite um CEP válido.",
        variant: "destructive"
      });
    }
  };

  const nextImage = () => {
    setActiveImage((activeImage + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((activeImage - 1 + images.length) % images.length);
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < Math.round(rating) ? "text-construPro-yellow fill-construPro-yellow" : "text-gray-300"}
      />
    ));
  };
  
  // Calculate discount percentage if there's a previous price
  const getDiscountPercentage = () => {
    if (produto.precoAnterior && produto.precoAnterior > produto.preco) {
      const discount = ((produto.precoAnterior - produto.preco) / produto.precoAnterior) * 100;
      return Math.round(discount);
    }
    return null;
  };
  
  const discountPercentage = getDiscountPercentage();
  const isOnSale = !!discountPercentage;

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header - hidden on scroll down */}
      <div className={`bg-white p-4 flex items-center sticky top-0 z-10 shadow-sm transition-transform duration-300 ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}>
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">Detalhes do Produto</h1>
        
        {/* CEP Selection */}
        <button 
          onClick={handleChangeCep}
          className="flex items-center text-sm text-gray-600 border border-gray-300 rounded-full px-3 py-1"
        >
          <MapPin size={14} className="mr-1" />
          <span>{cep.substring(0, 5)}-XXX</span>
          <ChevronDown size={14} className="ml-1" />
        </button>
      </div>

      {/* Image Carousel */}
      <div className="relative bg-gray-100 h-80">
        <img
          src={images[activeImage]}
          alt={produto.nome}
          className="w-full h-full object-contain"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === activeImage ? "bg-construPro-orange" : "bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <img src={loja.logoUrl} alt={loja.nome} className="w-5 h-5 rounded-full object-cover mr-2" />
              <span className="text-sm text-gray-600">{loja.nome}</span>
            </div>
            <div className="flex items-center">
              {renderStars(produto.avaliacao)}
              <span className="ml-1 text-sm text-gray-600">{produto.avaliacao} (143)</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{produto.nome}</h1>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              {isOnSale ? (
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-construPro-blue">
                      R$ {produto.preco.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 line-through ml-2">
                      R$ {produto.precoAnterior?.toFixed(2)}
                    </p>
                    <span className="ml-2 bg-construPro-orange text-white text-xs px-2 py-1 rounded-sm">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">Em até 12x sem juros</span>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-construPro-blue">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                  <span className="text-sm text-gray-600">Em até 12x sem juros</span>
                </div>
              )}
            </div>
            <div className="bg-construPro-orange/10 text-construPro-orange rounded-full px-3 py-1 text-sm font-medium">
              {produto.pontos} pontos
            </div>
          </div>

          <p className="bg-gray-100 inline-block px-2 py-1 rounded text-sm text-gray-700 mb-4">
            {produto.categoria}
          </p>
          
          {/* Delivery information */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <MapPin size={16} className="text-construPro-blue mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium">Entrega para {cidade} - {cep}</p>
                <p className="text-xs text-gray-600">Chegará entre {formatDate(today)} e {formatDate(deliveryDate)}</p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{produto.descricao}</p>
        </div>

        {/* Specifications */}
        <div>
          <h2 className="text-lg font-bold mb-2">Especificações</h2>
          <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
            {produto.especificacoes.map((spec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <div className="w-2 h-2 rounded-full bg-construPro-orange mt-1.5 mr-2"></div>
                {spec}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Quantity */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Quantidade</h3>
          <div className="flex items-center">
            <button
              onClick={decrementQuantidade}
              disabled={quantidade <= 1}
              className="w-10 h-10 rounded-l-md border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50"
            >
              <Minus size={16} />
            </button>
            <div className="w-14 h-10 flex items-center justify-center border-t border-b border-gray-300 bg-white">
              {quantidade}
            </div>
            <button
              onClick={incrementQuantidade}
              disabled={quantidade >= produto.estoque}
              className="w-10 h-10 rounded-r-md border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
            <span className="ml-4 text-sm text-gray-600">
              {produto.estoque} unidades disponíveis
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="pt-4 flex gap-3">
          <CustomButton
            variant="primary"
            fullWidth
            onClick={handleComprar}
            icon={<ShoppingCart size={18} />}
          >
            Adicionar ao carrinho
          </CustomButton>
        </div>
      </div>
      
      {/* CEP Modal */}
      <Dialog open={cepModalOpen} onOpenChange={setCepModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione onde quer receber seu pedido</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">Digite seu CEP:</label>
            <Input 
              value={newCep} 
              onChange={(e) => setNewCep(e.target.value)} 
              placeholder="00000-000" 
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-2">
              O CEP determina quais produtos e lojas estarão disponíveis para você.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCepModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCepChange}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProdutoDetailScreen;
