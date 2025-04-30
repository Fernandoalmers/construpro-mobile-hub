
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CustomButton from '../common/CustomButton';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Project } from '@/types/services';

interface ProjectCardProps {
  project: Project;
  isProfessional: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isProfessional }) => {
  const navigate = useNavigate();
  
  const completedSteps = project.etapas.filter(step => step.concluido).length;
  const totalSteps = project.etapas.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const handleViewDetails = () => {
    navigate(`/services/project/${project.id}`);
  };

  const handleViewChat = () => {
    navigate(`/chat/project-${project.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-base">{project.titulo}</h3>
            <Badge 
              className={project.concluido 
                ? "bg-green-100 text-green-800" 
                : "bg-blue-100 text-blue-800"
              }
            >
              {project.concluido ? 'Concluído' : 'Em andamento'}
            </Badge>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-3">
            <div>
              <p>{isProfessional ? 'Cliente:' : 'Profissional:'} {project.nomeContraparte}</p>
              <p>Local: {project.endereco}</p>
            </div>
            <div className="text-right">
              <p>Valor: {project.valor}</p>
              <p>Prazo: {project.dataEstimada}</p>
            </div>
          </div>
          
          <div className="mb-1 flex justify-between text-xs">
            <span>Progresso do projeto</span>
            <span className="font-medium">{completedSteps}/{totalSteps} etapas</span>
          </div>
          <Progress value={progressPercentage} className="h-2 mb-3" />
          
          {project.etapas.length > 0 && (
            <div className="text-xs text-gray-500 mb-2">
              <p>
                {project.concluido 
                  ? 'Projeto finalizado' 
                  : `Próxima etapa: ${
                      project.etapas.find(step => !step.concluido)?.titulo || 'Todas etapas concluídas'
                    }`
                }
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-100 p-3 bg-gray-50 flex gap-2 justify-end">
          <CustomButton
            variant="outline"
            size="sm"
            icon={<MessageSquare size={14} />}
            onClick={handleViewChat}
          >
            Chat
          </CustomButton>
          <CustomButton 
            variant={project.concluido ? 'outline' : 'primary'}
            size="sm"
            onClick={handleViewDetails}
          >
            {project.concluido ? 'Ver detalhes' : 'Gerenciar projeto'}
          </CustomButton>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
