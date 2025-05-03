
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import CustomInput from '../common/CustomInput';
import ServiceRequestCard from './ServiceRequestCard';
import ListEmptyState from '../common/ListEmptyState';
import { ServiceRequest } from '@/types/services';
import { servicesService } from '@/services/servicesManagementService';

interface AvailableServicesScreenProps {
  isProfessional: boolean;
}

const ServicesAvailableScreen: React.FC<AvailableServicesScreenProps> = ({ isProfessional }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const services = await servicesService.getAvailableServices();
        setServiceRequests(services);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Erro ao carregar serviços disponíveis. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Filter available service requests based on search query
  const filteredServices = serviceRequests.filter(
    request => 
      searchQuery === '' || 
      request.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.descricao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <CustomInput
        placeholder="Buscar serviços..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        isSearch
      />

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        ) : filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceRequestCard 
              key={service.id} 
              service={service} 
              isProfessional={isProfessional} 
              showSendProposalButton={isProfessional}
            />
          ))
        ) : (
          <ListEmptyState
            icon={<Search className="h-12 w-12 text-gray-400" />}
            title="Nenhum serviço disponível"
            description="Não há solicitações de serviço disponíveis no momento."
          />
        )}
      </div>
    </div>
  );
};

export default ServicesAvailableScreen;
