
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ServiceRequest, Project } from '@/types/services';
import ServiceRequestCard from './ServiceRequestCard';
import ProjectCard from './ProjectCard';
import ListEmptyState from '../common/ListEmptyState';
import { ClipboardCheck, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { serviceRequestsService } from '@/services/serviceRequestsService';
import { projectsService } from '@/services/projectsService';

interface MyServicesScreenProps {
  isProfessional: boolean;
}

const MyServicesScreen: React.FC<MyServicesScreenProps> = ({ isProfessional }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const { user } = useAuth();
  const [myServiceRequests, setMyServiceRequests] = useState<ServiceRequest[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch service requests
        const filters = isProfessional ? {} : { status: 'all' };
        const requests = await serviceRequestsService.getAvailableServices(filters);
        
        // Filter requests based on user role
        const filteredRequests = isProfessional 
          ? requests.filter(request => request.propostas.some(p => p.profissionalId === user?.id))
          : requests.filter(request => request.clienteId === user?.id);
        
        setMyServiceRequests(filteredRequests);
        
        // Fetch projects
        const projects = await projectsService.getProjects(isProfessional);
        setMyProjects(projects);
      } catch (error) {
        console.error('Error fetching user services/projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, isProfessional]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {myServiceRequests.length > 0 ? (
            myServiceRequests.map(service => (
              <ServiceRequestCard 
                key={service.id} 
                service={service} 
                isProfessional={isProfessional} 
                isMyRequest={true}
              />
            ))
          ) : (
            <ListEmptyState
              icon={<List className="h-12 w-12 text-gray-400" />}
              title="Nenhuma solicitação"
              description={isProfessional 
                ? "Você ainda não enviou propostas para serviços." 
                : "Você não tem nenhuma solicitação de serviço."
              }
            />
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {myProjects.length > 0 ? (
            myProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                isProfessional={isProfessional}
              />
            ))
          ) : (
            <ListEmptyState
              icon={<ClipboardCheck className="h-12 w-12 text-gray-400" />}
              title="Nenhum projeto"
              description="Você ainda não tem projetos em andamento."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyServicesScreen;
