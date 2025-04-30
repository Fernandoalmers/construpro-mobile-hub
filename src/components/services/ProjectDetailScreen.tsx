
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CustomButton from '../common/CustomButton';
import { Avatar } from '@/components/ui/avatar';
import { Check, ChevronDown, ChevronUp, Image, MessageSquare, Star } from 'lucide-react';
import { projectsMock } from '@/data/projects';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import RateProjectModal from './RateProjectModal';

const ProjectDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  
  // In a real app, fetch project by ID
  const project = projectsMock.find(p => p.id === id) || projectsMock[0];
  const isProfessional = user?.papel === 'profissional';
  
  const completedSteps = project.etapas.filter(step => step.concluido).length;
  const totalSteps = project.etapas.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const handleCompleteStep = (stepId: string) => {
    // Here would be the API call to mark the step as completed
    toast.success('Etapa marcada como concluída!');
  };

  const handleChatWithClient = () => {
    navigate(`/chat/project-${project.id}`);
  };

  const toggleStep = (stepId: string) => {
    setOpenStepId(openStepId === stepId ? null : stepId);
  };

  const handleRateProject = () => {
    setRateModalOpen(true);
  };

  return (
    <div className="flex flex-col pb-16">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-construPro-blue">Projeto</h1>
      </div>
      
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-medium">{project.titulo}</h2>
              <Badge 
                className={project.concluido 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
                }
              >
                {project.concluido ? 'Concluído' : 'Em andamento'}
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{isProfessional ? 'Cliente:' : 'Profissional:'}</span> {project.nomeContraparte}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Local:</span> {project.endereco}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Valor:</span> {project.valor}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Data estimada:</span> {project.dataEstimada}
                </p>
              </div>
            </div>
            
            <div className="mb-1 flex justify-between text-xs">
              <span>Progresso do projeto</span>
              <span className="font-medium">{completedSteps}/{totalSteps} etapas</span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-3" />
            
            <div className="flex gap-2 justify-end">
              <CustomButton
                variant="outline"
                icon={<MessageSquare size={16} />}
                onClick={handleChatWithClient}
              >
                Chat
              </CustomButton>
              
              {!isProfessional && project.concluido && !project.avaliado && (
                <CustomButton
                  variant="primary"
                  icon={<Star size={16} />}
                  onClick={handleRateProject}
                >
                  Avaliar profissional
                </CustomButton>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="progress">Andamento</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <div className="space-y-3">
              {project.etapas.map((step) => (
                <Card key={step.id}>
                  <Collapsible
                    open={openStepId === step.id}
                    onOpenChange={() => toggleStep(step.id)}
                  >
                    <div className={`flex justify-between items-center p-3 ${step.concluido ? 'bg-green-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full w-6 h-6 flex items-center justify-center ${
                          step.concluido ? 'bg-green-500 text-white' : 'border border-gray-300'
                        }`}>
                          {step.concluido && <Check size={14} />}
                          {!step.concluido && <span className="text-xs text-gray-500">{step.ordem}</span>}
                        </div>
                        <span className={step.concluido ? 'line-through text-gray-500' : 'font-medium'}>
                          {step.titulo}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {step.concluido && (
                          <Badge className="bg-green-100 text-green-800">Concluído</Badge>
                        )}
                        <CollapsibleTrigger asChild>
                          <button className="text-gray-500 hover:text-gray-700">
                            {openStepId === step.id ? 
                              <ChevronUp size={18} /> : 
                              <ChevronDown size={18} />
                            }
                          </button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    
                    <CollapsibleContent className="p-3 border-t">
                      <p className="text-sm text-gray-700 mb-3">{step.descricao}</p>
                      
                      {isProfessional && !step.concluido && !project.concluido && (
                        <div className="flex justify-end">
                          <CustomButton
                            variant="outline"
                            size="sm"
                            icon={<Check size={14} />}
                            onClick={() => handleCompleteStep(step.id)}
                          >
                            Marcar como concluída
                          </CustomButton>
                        </div>
                      )}

                      {step.concluido && step.comentario && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-500">Concluído em: {step.dataConclusao}</p>
                          <p className="mt-1">{step.comentario}</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Detalhes do Projeto</h3>
                
                <div className="text-sm">
                  <p className="mb-2">{project.descricao}</p>
                  
                  <p className="font-medium mt-3 mb-1">Comentários iniciais:</p>
                  <p>{project.comentariosIniciais}</p>
                  
                  {project.concluido && (
                    <>
                      <p className="font-medium mt-3 mb-1">Data de conclusão:</p>
                      <p>{project.dataConclusao}</p>
                      
                      {project.comentariosFinais && (
                        <>
                          <p className="font-medium mt-3 mb-1">Comentários finais:</p>
                          <p>{project.comentariosFinais}</p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">
                  {isProfessional ? 'Dados do Cliente' : 'Dados do Profissional'}
                </h3>
                
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <img src={project.fotoContraparte || '/placeholder.svg'} alt={project.nomeContraparte} />
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.nomeContraparte}</p>
                    <p className="text-sm text-gray-500">{project.especialidadeContraparte || 'Cliente'}</p>
                  </div>
                </div>
                
                <CustomButton 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isProfessional) {
                      // View client profile
                    } else {
                      navigate(`/services/professional/${project.profissionalId}`);
                    }
                  }}
                >
                  Ver perfil
                </CustomButton>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            {project.imagens.length > 0 ? (
              <div>
                <Card className="mb-3">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Imagens do projeto</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {project.imagens.map((image, index) => (
                        <div key={index} className="aspect-square rounded-md overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {isProfessional && !project.concluido && (
                  <div className="flex justify-center">
                    <CustomButton
                      variant="outline"
                      icon={<Image size={16} />}
                    >
                      Adicionar imagens
                    </CustomButton>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Image className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-500">Nenhuma imagem do projeto adicionada ainda.</p>
                  
                  {isProfessional && !project.concluido && (
                    <div className="mt-4">
                      <CustomButton
                        variant="outline"
                        icon={<Image size={16} />}
                      >
                        Adicionar imagens
                      </CustomButton>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RateProjectModal
        open={rateModalOpen}
        onOpenChange={setRateModalOpen}
        projectId={project.id}
        professionalName={project.nomeContraparte}
        professionalId={project.profissionalId}
      />
    </div>
  );
};

export default ProjectDetailScreen;
