
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ListEmptyState from '../common/ListEmptyState';
import { serviceRequestsMock } from '@/data/serviceRequests';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Proposal } from '@/types/services';

// Mock data - In a real app, this would come from the API
const getMyProposals = (userId: string) => {
  const allProposals: { proposal: Proposal; service: any }[] = [];
  
  // Extract all proposals across service requests
  serviceRequestsMock.forEach(service => {
    service.propostas
      .filter(proposal => proposal.profissionalId === userId)
      .forEach(proposal => {
        allProposals.push({
          proposal,
          service
        });
      });
  });
  
  return allProposals;
};

const ProposalStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'aceita':
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle size={12} />
          <span>Aceita</span>
        </Badge>
      );
    case 'recusada':
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle size={12} />
          <span>Recusada</span>
        </Badge>
      );
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock size={12} />
          <span>Aguardando</span>
        </Badge>
      );
  }
};

const MyProposalsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  
  // Get proposals from mock data
  const myProposals = getMyProposals(user?.id || '1');
  
  // Filter proposals based on active tab
  const filteredProposals = myProposals.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.proposal.status === 'enviada';
    if (activeTab === 'accepted') return item.proposal.status === 'aceita';
    if (activeTab === 'rejected') return item.proposal.status === 'recusada';
    return true;
  });
  
  const handleViewService = (serviceId: string) => {
    navigate(`/services/request/${serviceId}`);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Aguardando</TabsTrigger>
          <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          <TabsTrigger value="rejected">Recusadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4 mt-0">
          {filteredProposals.length > 0 ? (
            filteredProposals.map(({ proposal, service }) => (
              <Card key={proposal.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{service.titulo}</h3>
                      <ProposalStatusBadge status={proposal.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Valor proposto</p>
                        <p className="font-medium">{proposal.valor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Prazo</p>
                        <p className="font-medium">{proposal.prazo}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{proposal.mensagem}</p>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <span>
                        Enviada {format(new Date(proposal.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 p-3 bg-gray-50 flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewService(service.id)}
                    >
                      Ver serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <ListEmptyState
              icon={<Clock className="h-12 w-12 text-gray-400" />}
              title="Nenhuma proposta encontrada"
              description={
                activeTab === 'all'
                  ? "Você ainda não enviou propostas para serviços."
                  : `Você não tem propostas com status ${
                    activeTab === 'pending' ? 'aguardando' :
                    activeTab === 'accepted' ? 'aceitas' : 'recusadas'
                  }.`
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProposalsScreen;
