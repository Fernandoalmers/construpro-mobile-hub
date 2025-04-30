
import { Project } from '../types/services';

export const projectsMock: Project[] = [
  {
    id: '1',
    titulo: 'Instalação de ar-condicionado',
    descricao: 'Instalação de 2 aparelhos split (9000 e 12000 BTUs) com infraestrutura',
    valor: 'R$ 850,00',
    dataInicio: '2025-04-16',
    dataEstimada: '2025-04-17',
    endereco: 'Moema, São Paulo - SP',
    status: 'em_andamento',
    concluido: false,
    avaliado: false,
    clienteId: '3',
    profissionalId: '2',
    nomeContraparte: 'Ricardo Gomes',
    fotoContraparte: '/placeholder.svg',
    especialidadeContraparte: 'Eletricista',
    comentariosIniciais: 'Cliente já tem os aparelhos no local. É necessário realizar a instalação da infraestrutura e fazer a instalação dos equipamentos.',
    etapas: [
      {
        id: 'e1-1',
        ordem: 1,
        titulo: 'Verificação do local e planejamento',
        descricao: 'Visita técnica para verificar pontos de instalação e planejamento do trabalho',
        concluido: true,
        dataConclusao: '2025-04-16',
        comentario: 'Local verificado, tudo ok para iniciar os trabalhos.'
      },
      {
        id: 'e1-2',
        ordem: 2,
        titulo: 'Instalação da infraestrutura',
        descricao: 'Instalação de suportes, tubulação e passagem dos cabos',
        concluido: false
      },
      {
        id: 'e1-3',
        ordem: 3,
        titulo: 'Instalação das unidades internas',
        descricao: 'Fixação e conexão das unidades internas',
        concluido: false
      },
      {
        id: 'e1-4',
        ordem: 4,
        titulo: 'Instalação das unidades externas',
        descricao: 'Fixação e conexão das unidades externas',
        concluido: false
      },
      {
        id: 'e1-5',
        ordem: 5,
        titulo: 'Testes finais',
        descricao: 'Realização de testes de funcionamento e ajustes finais',
        concluido: false
      }
    ],
    imagens: []
  },
  {
    id: '2',
    titulo: 'Reforma de banheiro',
    descricao: 'Reforma completa de banheiro de 4m²',
    valor: 'R$ 3.200,00',
    dataInicio: '2025-04-12',
    dataEstimada: '2025-04-20',
    dataConclusao: '2025-04-19',
    endereco: 'Santana, São Paulo - SP',
    status: 'concluido',
    concluido: true,
    avaliado: true,
    clienteId: '4',
    profissionalId: '3',
    nomeContraparte: 'Roberto Lima',
    fotoContraparte: '/placeholder.svg',
    especialidadeContraparte: 'Pedreiro',
    comentariosIniciais: 'Cliente fornece todos os materiais. Reforma completa incluindo troca de revestimentos, louças e metais.',
    comentariosFinais: 'Serviço finalizado com sucesso, cliente satisfeito com o resultado.',
    etapas: [
      {
        id: 'e2-1',
        ordem: 1,
        titulo: 'Demolição do banheiro antigo',
        descricao: 'Remoção de revestimentos, louças e metais existentes',
        concluido: true,
        dataConclusao: '2025-04-13',
        comentario: 'Demolição concluída em um dia.'
      },
      {
        id: 'e2-2',
        ordem: 2,
        titulo: 'Preparação hidráulica',
        descricao: 'Revisão das instalações hidráulicas e ajustes necessários',
        concluido: true,
        dataConclusao: '2025-04-14',
        comentario: 'Instalações hidráulicas em bom estado, apenas pequenos ajustes realizados.'
      },
      {
        id: 'e2-3',
        ordem: 3,
        titulo: 'Preparação elétrica',
        descricao: 'Revisão das instalações elétricas e ajustes necessários',
        concluido: true,
        dataConclusao: '2025-04-15',
        comentario: 'Instalações elétricas revisadas e atualizadas conforme necessário.'
      },
      {
        id: 'e2-4',
        ordem: 4,
        titulo: 'Assentamento de pisos e revestimentos',
        descricao: 'Colocação de pisos e azulejos conforme projeto',
        concluido: true,
        dataConclusao: '2025-04-17',
        comentario: 'Revestimentos assentados conforme especificação do cliente.'
      },
      {
        id: 'e2-5',
        ordem: 5,
        titulo: 'Instalação de louças e metais',
        descricao: 'Instalação de vaso sanitário, pia, chuveiros e torneiras',
        concluido: true,
        dataConclusao: '2025-04-18',
        comentario: 'Todas as louças e metais instalados.'
      },
      {
        id: 'e2-6',
        ordem: 6,
        titulo: 'Acabamentos e limpeza',
        descricao: 'Acabamentos finais e limpeza do local',
        concluido: true,
        dataConclusao: '2025-04-19',
        comentario: 'Projeto finalizado com limpeza completa do local.'
      }
    ],
    imagens: [
      {
        id: 'i2-1',
        url: '/placeholder.svg',
        descricao: 'Banheiro antes da reforma',
        dataUpload: '2025-04-12'
      },
      {
        id: 'i2-2',
        url: '/placeholder.svg',
        descricao: 'Etapa de demolição',
        dataUpload: '2025-04-13'
      },
      {
        id: 'i2-3',
        url: '/placeholder.svg',
        descricao: 'Assentamento de azulejos',
        dataUpload: '2025-04-16'
      },
      {
        id: 'i2-4',
        url: '/placeholder.svg',
        descricao: 'Banheiro finalizado',
        dataUpload: '2025-04-19'
      }
    ]
  }
];
