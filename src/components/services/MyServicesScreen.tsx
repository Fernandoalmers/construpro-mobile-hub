
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { serviceRequestsMock } from '@/data/serviceRequests';
import { projectsMock } from '@/data/projects';
import ServiceRequestCard from './ServiceRequestCard';
import ProjectCard from './ProjectCard';
import ListEmptyState from '../common/ListEmptyState';
import { ClipboardCheck, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MyServicesScreenProps {
  isProfessional: boolean;
}

const MyServicesScreen: React.FC<MyServicesScreenProps> = ({ isProfessional }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const { user } = useAuth();

  // Mock data filtering - in real app, this would use actual user ID
  const userOrProfessionalId = user?.id || '1';
  
  const myServiceRequests = serviceRequestsMock.filter(request => 
    isProfessional 
      ? request.propostas.some(p => p.profissionalId === userOrProfessionalId)
      : request.clienteId === userOrProfessionalId
  );

  const myProjects = projectsMock.filter(project => 
    isProfessional 
      ? project.profissionalId === userOrProfessionalId
      : project.clienteId === userOrProfessionalId
  );

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
