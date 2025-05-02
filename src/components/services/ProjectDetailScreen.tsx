import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, MessageCircle, Tool, User, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import RateProjectModal from './RateProjectModal';
import { Project } from '@/types/services';
import { projectsMock } from '@/data/projects';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

const ProjectDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from an API
    const foundProject = projectsMock.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
    }
    setIsLoading(false);
  }, [id]);

  // Default to consumer if no profile or papel is undefined
  const isProfessional = profile?.papel === 'profissional' || profile?.tipo_perfil === 'profissional';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-construPro-blue"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Projeto não encontrado</h1>
        </div>
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <p className="text-lg font-medium">O projeto solicitado não foi encontrado.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/services')}
          >
            Voltar para serviços
          </Button>
        </Card>
      </div>
    );
  }

  const handleCompleteProject = () => {
    toast.success("Projeto marcado como concluído!");
    navigate('/services');
  };

  const handleCancelProject = () => {
    toast.success("Projeto cancelado com sucesso!");
    navigate('/services');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Detalhes do Projeto</h1>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-6 space-y-4">
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{project.titulo}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">{project.descricao}</p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Calendar className="text-construPro-blue mr-2" size={18} />
              <span className="text-sm">Data de início: {formatDate(project.dataInicio)}</span>
            </div>
            
            {project.dataTermino && (
              <div className="flex items-center">
                <Calendar className="text-construPro-blue mr-2" size={18} />
                <span className="text-sm">Data de término: {formatDate(project.dataTermino)}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="text-construPro-blue mr-2" size={18} />
              <span className="text-sm">Duração estimada: {project.duracaoEstimada} dias</span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="text-construPro-blue mr-2" size={18} />
              <span className="text-sm">Valor: {formatCurrency(project.valor)}</span>
            </div>
            
            <div className="flex items-center">
              <Tool className="text-construPro-blue mr-2" size={18} />
              <span className="text-sm">Categoria: {project.categoria}</span>
            </div>
          </div>
        </Card>
        
        {/* Client or Professional Info */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">
            {isProfessional ? 'Cliente' : 'Profissional'}
          </h3>
          <div className="flex items-center">
            <Avatar 
              src={isProfessional ? project.cliente.avatar : project.profissional.avatar}
              alt={isProfessional ? project.cliente.nome : project.profissional.nome}
              fallback={isProfessional ? project.cliente.nome.charAt(0) : project.profissional.nome.charAt(0)}
              size="md"
            />
            <div className="ml-3">
              <p className="font-medium">{isProfessional ? project.cliente.nome : project.profissional.nome}</p>
              <div className="flex items-center text-sm text-gray-500">
                <User size={14} className="mr-1" />
                <span>
                  {isProfessional ? 'Cliente' : 'Profissional'} desde {
                    formatDate(isProfessional ? project.cliente.dataCadastro : project.profissional.dataCadastro)
                  }
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => toast.success("Chat iniciado!")}
          >
            <MessageCircle size={16} className="mr-2" />
            Enviar mensagem
          </Button>
        </Card>
        
        {/* Actions */}
        {project.status === 'em_andamento' && (
          <div className="space-y-3">
            {isProfessional ? (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleCompleteProject}
              >
                <CheckCircle size={16} className="mr-2" />
                Marcar como concluído
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Confirmar conclusão
                  </Button>
                </DialogTrigger>
                <RateProjectModal 
                  projectId={project.id} 
                  professionalName={project.profissional.nome}
                  onRateComplete={() => {
                    toast.success("Avaliação enviada com sucesso!");
                    navigate('/services');
                  }}
                />
              </Dialog>
            )}
            
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200"
              onClick={handleCancelProject}
            >
              <X size={16} className="mr-2" />
              Cancelar projeto
            </Button>
          </div>
        )}
        
        {project.status === 'concluido' && !isProfessional && !project.avaliado && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <CheckCircle size={16} className="mr-2" />
                Avaliar serviço
              </Button>
            </DialogTrigger>
            <RateProjectModal 
              projectId={project.id} 
              professionalName={project.profissional.nome}
              onRateComplete={() => {
                toast.success("Avaliação enviada com sucesso!");
                navigate('/services');
              }}
            />
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailScreen;
