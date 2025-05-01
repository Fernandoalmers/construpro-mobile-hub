
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ListEmptyState from '../common/ListEmptyState';
import { projectsMock } from '@/data/projects';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompletedServicesScreenProps {
  isProfessional: boolean;
}

const CompletedServicesScreen: React.FC<CompletedServicesScreenProps> = ({ isProfessional }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Filter completed projects based on user role
  const completedProjects = projectsMock
    .filter(project => 
      (isProfessional ? project.profissionalId : project.clienteId) === (user?.id || '1') &&
      project.status === 'concluido'
    );
  
  const handleViewProject = (projectId: string) => {
    navigate(`/services/project/${projectId}`);
  };
  
  // Calculate project duration in days
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return differenceInDays(end, start);
  };
  
  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} 
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col gap-4">
      {completedProjects.length > 0 ? (
        completedProjects.map(project => (
          <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{project.titulo}</h3>
                  <Badge className="bg-green-100 text-green-800">Concluído</Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{project.descricao}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">{isProfessional ? 'Cliente' : 'Profissional'}</p>
                    <p className="font-medium">{project.nomeContraparte}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valor</p>
                    <p className="font-medium">{project.valor}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Início</p>
                      <p className="font-medium">{format(new Date(project.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conclusão</p>
                      <p className="font-medium">{format(new Date(project.dataConclusao || ''), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duração</p>
                      <p className="font-medium">{calculateDuration(project.dataInicio, project.dataConclusao || '')} dias</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avaliação</p>
                      {project.avaliado ? (
                        renderRating(4.5) // Em um app real, isso viria dos dados
                      ) : (
                        <p className="text-xs text-gray-600">Não avaliado</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 p-3 bg-gray-50 flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewProject(project.id)}
                >
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <ListEmptyState
          icon={<Check className="h-12 w-12 text-gray-400" />}
          title="Nenhum projeto concluído"
          description={
            isProfessional
              ? "Você ainda não finalizou nenhum projeto."
              : "Você ainda não teve nenhum serviço concluído."
          }
        />
      )}
    </div>
  );
};

export default CompletedServicesScreen;
