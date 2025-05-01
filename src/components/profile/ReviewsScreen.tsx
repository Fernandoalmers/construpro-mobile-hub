
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Star, Store, User } from 'lucide-react';
import Card from '../common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../../context/AuthContext';
import { reviewsMock } from '../../data/reviews';
import produtos from '../../data/produtos.json';

// Mock product reviews data
const mockProductReviews = [
  {
    id: "p-rev1",
    clienteId: "1",
    produtoId: "1",
    nota: 5,
    comentario: "Excelente produto! Superou minhas expectativas em qualidade e durabilidade.",
    data: "2025-04-15T10:30:00"
  },
  {
    id: "p-rev2",
    clienteId: "1",
    produtoId: "3",
    nota: 4,
    comentario: "Muito bom, mas poderia ter um acabamento melhor. No geral, satisfeito com a compra.",
    data: "2025-03-28T14:45:00"
  },
  {
    id: "p-rev3",
    clienteId: "1",
    produtoId: "5",
    nota: 5,
    comentario: "Ótima relação custo-benefício. Recomendo!",
    data: "2025-03-10T09:20:00"
  }
];

// Mock store reviews data
const mockStoreReviews = [
  {
    id: "s-rev1",
    clienteId: "1",
    lojaId: "1",
    lojaNome: "ConstruPro São Paulo",
    nota: 5,
    comentario: "Excelente atendimento e rapidez na entrega. Produtos chegaram bem embalados.",
    data: "2025-04-12T11:30:00"
  },
  {
    id: "s-rev2",
    clienteId: "1",
    lojaId: "2",
    lojaNome: "ConstruPro Rio de Janeiro",
    nota: 4,
    comentario: "Bom atendimento, mas entrega demorou um pouco. Produtos conforme o esperado.",
    data: "2025-03-20T16:15:00"
  }
];

const ReviewsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || "1"; // Default to first client if no user
  const [activeTab, setActiveTab] = useState("products");
  
  // Filter reviews by client ID
  const productReviews = mockProductReviews.filter(review => review.clienteId === userId);
  const storeReviews = mockStoreReviews.filter(review => review.clienteId === userId);
  const professionalReviews = reviewsMock.filter(review => review.clienteId === userId);
  
  // Get product details from ID
  const getProductDetails = (productId: string) => {
    return produtos.find(produto => produto.id === productId);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Rating stars
  const renderRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        size={14} 
        className={`${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Avaliações Feitas</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 -mt-6">
        <Card className="p-2">
          <Tabs defaultValue="products" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100">
              <TabsTrigger value="products" className="flex-1">Produtos</TabsTrigger>
              <TabsTrigger value="stores" className="flex-1">Lojas</TabsTrigger>
              <TabsTrigger value="professionals" className="flex-1">Profissionais</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            <h2 className="font-medium">Suas avaliações de produtos</h2>
            
            {productReviews.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="mx-auto text-gray-400 mb-3" size={40} />
                <h3 className="text-lg font-medium text-gray-700">Nenhuma avaliação de produto</h3>
                <p className="text-gray-500 mt-1">
                  Você ainda não avaliou nenhum produto
                </p>
              </div>
            ) : (
              productReviews.map(review => {
                const product = getProductDetails(review.produtoId);
                
                return (
                  <Card key={review.id} className="p-4">
                    <div className="flex mb-2">
                      <div 
                        className="w-12 h-12 bg-gray-200 rounded mr-3 bg-center bg-cover flex-shrink-0"
                        style={{ backgroundImage: `url(${product?.imagemUrl})` }}
                      />
                      <div>
                        <h3 className="font-medium">{product?.nome || 'Produto'}</h3>
                        <p className="text-xs text-gray-500">Avaliado em {formatDate(review.data)}</p>
                        <div className="flex mt-1">
                          {renderRatingStars(review.nota)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-md">
                      {review.comentario}
                    </p>
                  </Card>
                );
              })
            )}
          </>
        )}
        
        {/* Stores Tab */}
        {activeTab === "stores" && (
          <>
            <h2 className="font-medium">Suas avaliações de lojas</h2>
            
            {storeReviews.length === 0 ? (
              <div className="text-center py-10">
                <Store className="mx-auto text-gray-400 mb-3" size={40} />
                <h3 className="text-lg font-medium text-gray-700">Nenhuma avaliação de loja</h3>
                <p className="text-gray-500 mt-1">
                  Você ainda não avaliou nenhuma loja
                </p>
              </div>
            ) : (
              storeReviews.map(review => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center mb-2">
                    <Store size={20} className="text-construPro-blue mr-2" />
                    <div>
                      <h3 className="font-medium">{review.lojaNome}</h3>
                      <p className="text-xs text-gray-500">Avaliado em {formatDate(review.data)}</p>
                      <div className="flex mt-1">
                        {renderRatingStars(review.nota)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-md">
                    {review.comentario}
                  </p>
                </Card>
              ))
            )}
          </>
        )}
        
        {/* Professionals Tab */}
        {activeTab === "professionals" && (
          <>
            <h2 className="font-medium">Suas avaliações de profissionais</h2>
            
            {professionalReviews.length === 0 ? (
              <div className="text-center py-10">
                <User className="mx-auto text-gray-400 mb-3" size={40} />
                <h3 className="text-lg font-medium text-gray-700">Nenhuma avaliação de profissional</h3>
                <p className="text-gray-500 mt-1">
                  Você ainda não avaliou nenhum profissional
                </p>
              </div>
            ) : (
              professionalReviews.map(review => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center mb-2">
                    <User size={20} className="text-construPro-blue mr-2" />
                    <div>
                      <h3 className="font-medium">{review.nomeCliente}</h3>
                      <p className="text-xs text-gray-500">
                        Serviço: {review.servicoRealizado} • {formatDate(review.data)}
                      </p>
                      <div className="flex mt-1">
                        {renderRatingStars(review.nota)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-md">
                    {review.comentario}
                  </p>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsScreen;
