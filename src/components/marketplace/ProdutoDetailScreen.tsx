
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import { ArrowLeft, ShoppingCart, Gift, Star, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';

const ProdutoDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantidade, setQuantidade] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const produto = produtos.find(p => p.id === id);
  const loja = produto ? lojas.find(l => l.id === produto.lojaId) : undefined;

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
    // In a real app, this would add the product to the cart
    navigate('/cart');
  };

  const handleResgatar = () => {
    // In a real app, this would check if user has enough points and proceed
    navigate('/resgates');
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

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">Detalhes do Produto</h1>
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
              <span className="ml-1 text-sm text-gray-600">{produto.avaliacao}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{produto.nome}</h1>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-construPro-blue">
                R$ {produto.preco.toFixed(2)}
              </p>
              <span className="text-sm text-gray-600">Em até 12x sem juros</span>
            </div>
            <div className="bg-construPro-orange/10 text-construPro-orange rounded-full px-3 py-1 text-sm font-medium">
              {produto.pontos} pontos
            </div>
          </div>

          <p className="bg-gray-100 inline-block px-2 py-1 rounded text-sm text-gray-700 mb-4">
            {produto.categoria}
          </p>

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
            Comprar
          </CustomButton>
          
          <CustomButton
            variant="outline"
            fullWidth
            onClick={handleResgatar}
            icon={<Gift size={18} />}
          >
            Resgatar com pontos
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ProdutoDetailScreen;
