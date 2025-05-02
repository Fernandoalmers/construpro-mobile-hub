
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, User, DollarSign, MessageCircle, FileText, CheckCircle, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Card from '../common/Card';
import SendProposalModal from './SendProposalModal';
import { serviceRequestsMock } from '@/data/serviceRequests';
import { ServiceRequest } from '@/types/services';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

const ServiceRequestDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [service, setService] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from API
    const foundService = serviceRequestsMock.find(s => s.id === id);
    if (foundService) {
      setService(foundService);
    }
    setIsLoading(false);
  }, [id]);

  // Default to consumer if no profile or papel is undefined
  const isProfessional = profile?.papel === 'profissional' || profile?.tipo_perfil === 'profissional';

  if (isLoading) {
    return <div>Carregando detalhes do serviço...</div>;
  }

  if (!service) {
    return <div>Serviço não encontrado.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="container mx-auto">
          <button onClick={() => navigate(-1)} className="text-white flex items-center">
            <ArrowLeft size={20} className="mr-2" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white mt-4">{service.titulo}</h1>
          <p className="text-white opacity-80 mt-2">{service.descricao}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 -mt-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10" />
            <div>
              <h3 className="font-semibold">{service.nomeCliente}</h3>
              <p className="text-sm text-gray-500">
                <MapPin className="inline-block mr-1" size={14} /> {service.localizacao}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="mr-2" size={16} /> Data
              </h4>
              <p className="text-gray-800">{service.data}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="mr-2" size={16} /> Horário
              </h4>
              <p className="text-gray-800">{service.horario}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 flex items-center">
              <User className="mr-2" size={16} /> Detalhes do Cliente
            </h4>
            <p className="text-gray-800">{service.detalhesCliente}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="mr-2" size={16} /> Orçamento
            </h4>
            <p className="text-gray-800">{service.orcamento}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 flex items-center">
              <MessageCircle className="mr-2" size={16} /> Informações Adicionais
            </h4>
            <p className="text-gray-800">{service.informacoesAdicionais}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="mr-2" size={16} /> Requisitos
            </h4>
            <ul className="list-disc pl-5 text-gray-800">
              {service.requisitos?.map((requisito, index) => (
                <li key={index}>{requisito}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            {isProfessional ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-construPro-orange text-white hover:bg-orange-600">
                    <SendHorizontal className="mr-2" size={16} /> Enviar Proposta
                  </Button>
                </DialogTrigger>
                <SendProposalModal 
                  serviceId={service.id} 
                  open={false} 
                  onOpenChange={() => {}} 
                  serviceTitulo={service.titulo}
                />
              </Dialog>
            ) : (
              <Button disabled>
                <CheckCircle className="mr-2" size={16} /> Aguardando Propostas
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ServiceRequestDetailScreen;
