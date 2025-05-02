export type ServiceRequest = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  endereco: string;
  localizacao: string;
  data: string;
  horario: string;
  orcamento: string | null;
  status: 'aberto' | 'em_negociacao' | 'contratado' | 'concluido';
  dataCriacao: string;
  clienteId: string;
  cliente: string;
  nomeCliente: string;
  contatoCliente: string;
  requisitos: string[];
  detalhesCliente: string;
  informacoesAdicionais: string;
  propostas: Proposal[];
};

export type Proposal = {
  id: string;
  profissionalId: string;
  nomeProfissional: string;
  fotoProfissional?: string;
  especialidadeProfissional: string;
  valor: string;
  prazo: string;
  mensagem: string;
  status: 'enviada' | 'aceita' | 'recusada';
  dataCriacao: string;
};

export type Project = {
  id: string;
  titulo: string;
  descricao: string;
  valor: string;
  categoria: string;
  dataInicio: string;
  dataEstimada: string;
  dataConclusao?: string;
  dataTermino?: string;
  duracaoEstimada: number;
  endereco: string;
  status: string;
  concluido: boolean;
  avaliado: boolean;
  clienteId: string;
  profissionalId: string;
  nomeContraparte: string;
  fotoContraparte?: string;
  especialidadeContraparte?: string;
  comentariosIniciais: string;
  comentariosFinais?: string;
  etapas: ProjectStep[];
  imagens: ProjectImage[];
  cliente: {
    id: string;
    nome: string;
    avatar?: string;
    dataCadastro: string;
  };
  profissional: {
    id: string;
    nome: string;
    avatar?: string;
    dataCadastro: string;
  };
};

export type ProjectStep = {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  concluido: boolean;
  dataConclusao?: string;
  comentario?: string;
};

export type ProjectImage = {
  id: string;
  url: string;
  descricao?: string;
  dataUpload: string;
};

export type Professional = {
  id: string;
  nome: string;
  fotoPerfil?: string;
  especialidade: string;
  especialidades: string[];
  telefone: string;
  cidade: string;
  estado: string;
  avaliacao: number;
  servicosRealizados: number;
  sobre: string;
  areaAtuacao: string;
  portfolio: string[];
};

export type ProfessionalReview = {
  id: string;
  profissionalId: string;
  clienteId: string;
  nomeCliente: string;
  nota: number;
  comentario: string;
  data: string;
  servicoRealizado: string;
  projetoId: string;
};
