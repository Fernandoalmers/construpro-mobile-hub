
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ListEmptyState from '../common/ListEmptyState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Proposal } from '@/types/services';
import { proposalsService } from '@/services/proposalsService';
import { toast } from '@/components/ui/sonner';

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
  const [myProposals, setMyProposals] = useState<{ proposal: Proposal; service: any }[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProposals = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const proposals = await proposalsService.getMyProposals();
        setMyProposals(proposals);
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toast.error('Erro ao carregar propostas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [user]);
  
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
      </div>
    );
  }
  
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
                        Enviada {proposal.dataCriacao ? format(new Date(proposal.dataCriacao), 'dd/MM/yyyy', { locale: ptBR }) : ''}
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
