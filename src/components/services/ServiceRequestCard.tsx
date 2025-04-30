
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomButton from '../common/CustomButton';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { ServiceRequest } from '@/types/services';
import SendProposalModal from './SendProposalModal';

interface ServiceRequestCardProps {
  service: ServiceRequest;
  isProfessional: boolean;
  showSendProposalButton?: boolean;
  isMyRequest?: boolean;
}

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

const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({ 
  service, 
  isProfessional, 
  showSendProposalButton = false,
  isMyRequest = false
}) => {
  const navigate = useNavigate();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  
  // Check if professional already sent a proposal to this service
  const alreadySentProposal = isProfessional && 
    service.propostas.some(p => p.profissionalId === '1'); // Replace with actual professional ID
  
  const handleViewDetails = () => {
    navigate(`/services/request/${service.id}`);
  };

  const handleSendProposal = () => {
    setProposalModalOpen(true);
  };

  const handleViewChat = () => {
    navigate(`/chat/service-${service.id}`);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-base">{service.titulo}</h3>
              <Badge className={statusColors[service.status]}>
                {statusLabels[service.status]}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.descricao}</p>
            
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
            
            <div className="flex items-center text-xs text-gray-500">
              <span>
                {formatDistanceToNow(new Date(service.dataCriacao), { 
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
              {service.propostas.length > 0 && (
                <span className="ml-2 pl-2 border-l border-gray-300">
                  {service.propostas.length} proposta{service.propostas.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-100 p-3 bg-gray-50 flex gap-2 justify-end">
            {isProfessional && service.status === 'aberto' && showSendProposalButton && (
              <CustomButton
                variant="primary"
                size="sm"
                icon={<Send size={14} />}
                onClick={handleSendProposal}
                disabled={alreadySentProposal}
              >
                {alreadySentProposal ? 'Proposta enviada' : 'Enviar proposta'}
              </CustomButton>
            )}
            
            {(service.status === 'em_negociacao' || service.status === 'contratado') && (
              <CustomButton
                variant="outline"
                size="sm"
                icon={<MessageSquare size={14} />}
                onClick={handleViewChat}
              >
                Chat
              </CustomButton>
            )}
            
            <CustomButton 
              variant="outline" 
              size="sm"
              onClick={handleViewDetails}
            >
              Ver detalhes
            </CustomButton>
          </div>
        </CardContent>
      </Card>

      <SendProposalModal
        serviceId={service.id}
        serviceTitulo={service.titulo}
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
      />
    </>
  );
};

export default ServiceRequestCard;
