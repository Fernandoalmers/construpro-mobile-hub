
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CustomButton from '../common/CustomButton';
import { MessageSquare, UserCheck, Check, X } from 'lucide-react';
import { serviceRequestsMock } from '@/data/serviceRequests';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SendProposalModal from './SendProposalModal';

const statusColors = {
  'aberto': 'bg-green-100 text-green-800',
  'em_negociacao': 'bg-yellow-100 text-yellow-800',
  'contratado': 'bg-blue-100 text-blue-800',
  'concluido': 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  'aberto': 'Aberto',
  'em_negociacao': 'Em negociação',
  'contratado': 'Contratado',
  'concluido': 'Concluído',
};

const ServiceRequestDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  
  // In a real app, fetch service request by ID
  const service = serviceRequestsMock.find(s => s.id === id) || serviceRequestsMock[0];
  const isProfessional = user?.papel === 'profissional';
  const isMyRequest = !isProfessional && service.clienteId === user?.id;
  
  // Check if professional already sent a proposal
  const myProposal = isProfessional && 
    service.propostas.find(p => p.profissionalId === user?.id);
  
  const handleSendProposal = () => {
    setProposalModalOpen(true);
  };

  const handleAcceptProposal = (proposalId: string) => {
    // Here would be the API call to accept the proposal
    toast.success('Proposta aceita! Um novo projeto foi criado.');
    navigate('/services');
  };

  const handleRejectProposal = (proposalId: string) => {
    // Here would be the API call to reject the proposal
    toast.info('Proposta recusada');
  };

  const handleChatWithClient = () => {
    navigate(`/chat/service-${service.id}`);
  };

  return (
    <div className="flex flex-col pb-16">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-construPro-blue">Detalhes da Solicitação</h1>
      </div>
      
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-medium">{service.titulo}</h2>
              <Badge className={statusColors[service.status]}>
                {statusLabels[service.status]}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="bg-gray-50">
                {service.categoria}
              </Badge>
              <Badge variant="outline" className="bg-gray-50">
                {service.endereco}
              </Badge>
              {service.orcamento && (
                <Badge variant="outline" className="bg-gray-50">
                  Orçamento: {service.orcamento}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-700 mb-3">
              <p>{service.descricao}</p>
            </div>
            
            <div className="text-xs text-gray-500">
              Publicado {formatDistanceToNow(new Date(service.dataCriacao), { 
                addSuffix: true,
                locale: ptBR
              })}
              {' • '}
              {service.propostas.length} proposta{service.propostas.length !== 1 ? 's' : ''}
            </div>
            
            {isProfessional && service.status === 'aberto' && !myProposal && (
              <div className="mt-4 flex justify-end">
                <CustomButton
                  variant="primary"
                  onClick={handleSendProposal}
                >
                  Enviar proposta
                </CustomButton>
              </div>
            )}
            
            {isProfessional && myProposal && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-sm font-medium mb-1">Sua proposta</p>
                <p className="text-sm">Valor: {myProposal.valor}</p>
                <p className="text-sm">Prazo: {myProposal.prazo}</p>
                <p className="text-sm text-gray-600 mb-2">{myProposal.mensagem}</p>
                <Badge className={
                  myProposal.status === 'enviada' ? 'bg-blue-100 text-blue-800' :
                  myProposal.status === 'aceita' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }>
                  {myProposal.status === 'enviada' ? 'Enviada' : 
                   myProposal.status === 'aceita' ? 'Aceita' : 'Recusada'}
                </Badge>
              </div>
            )}
            
            {isProfessional && (service.status === 'em_negociacao' || service.status === 'contratado') && (
              <div className="mt-4 flex justify-end">
                <CustomButton
                  variant="primary"
                  icon={<MessageSquare size={16} />}
                  onClick={handleChatWithClient}
                >
                  Chat com cliente
                </CustomButton>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMyRequest && (
            <TabsList className="grid grid-cols-2 mb-4 w-full">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="proposals">Propostas</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Informações do Cliente</h3>
                <p>Nome: {service.nomeCliente}</p>
                <p>Contato: {service.contatoCliente}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isMyRequest && (
            <TabsContent value="proposals" className="space-y-4">
              {service.propostas.length > 0 ? (
                service.propostas.map((proposta) => (
                  <Card key={proposta.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <img src={proposta.fotoProfissional || '/placeholder.svg'} alt={proposta.nomeProfissional} />
                        </Avatar>
                        <div>
                          <p className="font-medium">{proposta.nomeProfissional}</p>
                          <p className="text-xs text-gray-500">{proposta.especialidadeProfissional}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="border border-gray-100 bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">Valor proposto</p>
                          <p className="font-medium">{proposta.valor}</p>
                        </div>
                        <div className="border border-gray-100 bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">Prazo estimado</p>
                          <p className="font-medium">{proposta.prazo}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-4">{proposta.mensagem}</p>
                      
                      <div className="flex justify-between">
                        <CustomButton
                          variant="outline"
                          size="sm"
                          icon={<UserCheck size={14} />}
                          onClick={() => navigate(`/services/professional/${proposta.profissionalId}`)}
                        >
                          Ver perfil
                        </CustomButton>
                        
                        {proposta.status === 'enviada' && (
                          <div className="flex gap-2">
                            <CustomButton
                              variant="outline"
                              size="sm"
                              icon={<X size={14} />}
                              onClick={() => handleRejectProposal(proposta.id)}
                            >
                              Recusar
                            </CustomButton>
                            <CustomButton
                              variant="primary"
                              size="sm"
                              icon={<Check size={14} />}
                              onClick={() => handleAcceptProposal(proposta.id)}
                            >
                              Aceitar
                            </CustomButton>
                          </div>
                        )}
                        
                        {proposta.status !== 'enviada' && (
                          <Badge className={
                            proposta.status === 'aceita' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }>
                            {proposta.status === 'aceita' ? 'Aceita' : 'Recusada'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-gray-500">
                    Ainda não há propostas para esta solicitação.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <SendProposalModal
        serviceId={service.id}
        serviceTitulo={service.titulo}
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
      />
    </div>
  );
};

export default ServiceRequestDetailScreen;
