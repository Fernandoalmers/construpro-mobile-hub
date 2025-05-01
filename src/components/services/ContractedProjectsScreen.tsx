
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Camera, MessageSquare, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import ListEmptyState from '../common/ListEmptyState';
import { projectsMock } from '@/data/projects';
import { Project } from '@/types/services';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

interface ContractedProjectsScreenProps {
  isProfessional: boolean;
}

const UploadPhotosModal = ({ isOpen, onClose, projectId }: { isOpen: boolean; onClose: () => void; projectId: string }) => {
  if (!isOpen) return null;
  
  // Simplificado para demonstração
  const handleUpload = () => {
    toast.success("Fotos enviadas com sucesso!");
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Enviar fotos do projeto</h3>
        <p className="mb-4 text-gray-600">Selecione as fotos que deseja enviar para este projeto.</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center mb-4">
          <Camera className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-sm text-gray-500">Clique para selecionar ou arraste as fotos para esta área</p>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleUpload}>Enviar</Button>
        </div>
      </div>
    </div>
  );
};

const ContractedProjectsScreen: React.FC<ContractedProjectsScreenProps> = ({ isProfessional }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Filter projects based on user role and only get ongoing projects
  const userProjects = projectsMock
    .filter(project => 
      (isProfessional ? project.profissionalId : project.clienteId) === (user?.id || '1') &&
      project.status === 'em_andamento'
    );
  
  // Calculates the project progress percentage
  const calculateProgress = (project: Project) => {
    if (!project.etapas || project.etapas.length === 0) return 0;
    const completedSteps = project.etapas.filter(step => step.concluido).length;
    return Math.round((completedSteps / project.etapas.length) * 100);
  };
  
  const handleViewProject = (projectId: string) => {
    navigate(`/services/project/${projectId}`);
  };
  
  const handleOpenChat = (projectId: string) => {
    navigate(`/chat/project-${projectId}`);
  };
  
  const handleUploadPhotos = (projectId: string) => {
    setSelectedProjectId(projectId);
    setUploadModalOpen(true);
  };
  
  const handleStepChange = (projectId: string, stepId: string, checked: boolean) => {
    // In a real app, this would make an API call to update the step status
    toast.success(checked ? "Etapa marcada como concluída" : "Etapa desmarcada");
  };
  
  return (
    <div className="flex flex-col gap-4">
      {userProjects.length > 0 ? (
        userProjects.map(project => {
          const progress = calculateProgress(project);
          
          return (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{project.titulo}</h3>
                    <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{project.descricao}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="font-medium">{project.nomeContraparte}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valor</p>
                      <p className="font-medium">{project.valor}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="border rounded-md divide-y">
                    {project.etapas
                      .filter((_, index) => index < 3) // Mostrar apenas as 3 primeiras etapas
                      .map(step => (
                        <div key={step.id} className="flex items-center p-2">
                          <Checkbox
                            id={step.id}
                            checked={step.concluido}
                            onCheckedChange={(checked) => 
                              handleStepChange(project.id, step.id, checked === true)
                            }
                            className="mr-2"
                            disabled={!isProfessional}
                          />
                          <label htmlFor={step.id} className="text-sm cursor-pointer flex-1">
                            {step.titulo}
                          </label>
                          {step.concluido && (
                            <CheckCircle className="text-green-500" size={16} />
                          )}
                        </div>
                      ))}
                    {project.etapas.length > 3 && (
                      <div className="p-2 text-center text-sm text-gray-500">
                        + {project.etapas.length - 3} etapas adicionais
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 p-3 bg-gray-50 flex flex-wrap gap-2">
                  {isProfessional && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleUploadPhotos(project.id)}
                    >
                      <Camera size={16} className="mr-1" />
                      Enviar fotos
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOpenChat(project.id)}
                  >
                    <MessageSquare size={16} className="mr-1" />
                    Chat
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProject(project.id)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <ListEmptyState
          icon={<Clock className="h-12 w-12 text-gray-400" />}
          title="Nenhum projeto em andamento"
          description={
            isProfessional
              ? "Você não tem nenhum projeto contratado em andamento no momento."
              : "Você não tem nenhum serviço contratado em andamento no momento."
          }
        />
      )}
      
      <UploadPhotosModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        projectId={selectedProjectId || ''} 
      />
    </div>
  );
};

export default ContractedProjectsScreen;
