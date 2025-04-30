
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomButton from '../common/CustomButton';
import { MessageSquare, Star } from 'lucide-react';
import { professionalsMock } from '@/data/professionals';
import { reviewsMock } from '@/data/reviews';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const ProfessionalProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();
  
  // In a real app, fetch professional data by ID
  const professional = professionalsMock.find(p => p.id === id) || professionalsMock[0];
  
  // In a real app, fetch reviews by professional ID
  const reviews = reviewsMock.filter(r => r.profissionalId === professional.id);
  
  const handleContactProfessional = () => {
    // Navigate to chat with this professional
    toast.success('Chat iniciado com o profissional');
    navigate(`/chat/professional-${professional.id}`);
  };

  return (
    <div className="flex flex-col pb-16">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-construPro-blue">Perfil do Profissional</h1>
      </div>
      
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start mb-4">
              <Avatar className="w-24 h-24 border-2 border-construPro-orange">
                <img src={professional.fotoPerfil || '/placeholder.svg'} alt={professional.nome} />
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold">{professional.nome}</h2>
                <p className="text-gray-600">{professional.especialidade}</p>
                
                <div className="flex items-center justify-center sm:justify-start mt-2 mb-1">
                  <div className="flex items-center text-yellow-500 mr-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Star 
                        key={i}
                        size={16}
                        fill={i < Math.floor(professional.avaliacao) ? 'currentColor' : 'none'}
                        className={i < Math.floor(professional.avaliacao) ? 'text-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm">
                    {professional.avaliacao.toFixed(1)} ({reviews.length} avaliações)
                  </span>
                </div>
                
                <p className="text-sm text-gray-500">
                  {professional.servicosRealizados} serviços realizados • {professional.cidade}/{professional.estado}
                </p>
                
                <div className="mt-3">
                  <CustomButton
                    variant="primary"
                    size="sm"
                    icon={<MessageSquare size={16} />}
                    onClick={handleContactProfessional}
                  >
                    Entrar em contato
                  </CustomButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Especialidades</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {professional.especialidades.map((especialidade, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {especialidade}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="font-medium mb-2">Sobre</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {professional.sobre}
                </p>
                
                <h3 className="font-medium mb-2">Área de atuação</h3>
                <p className="text-sm text-gray-700">
                  {professional.areaAtuacao}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Trabalhos realizados</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {professional.portfolio.map((image, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Trabalho ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{review.nomeCliente}</p>
                        <p className="text-xs text-gray-500">{review.data}</p>
                      </div>
                      <div className="flex items-center">
                        {Array(5).fill(0).map((_, i) => (
                          <Star 
                            key={i}
                            size={14}
                            fill={i < review.nota ? 'currentColor' : 'none'}
                            className={i < review.nota ? 'text-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm">{review.comentario}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Serviço: {review.servicoRealizado}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  Este profissional ainda não possui avaliações.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfessionalProfileScreen;
