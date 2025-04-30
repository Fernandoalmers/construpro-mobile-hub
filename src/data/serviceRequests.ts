
import { ServiceRequest } from '../types/services';

export const serviceRequestsMock: ServiceRequest[] = [
  {
    id: '1',
    titulo: 'Assentar piso em 25m²',
    descricao: 'Preciso de um profissional para assentar porcelanato em 25m² na sala e cozinha. O material já foi comprado, só preciso da mão de obra. Assentamento na diagonal.',
    categoria: 'piso',
    endereco: 'Jardim Paulista, São Paulo - SP',
    orcamento: 'R$ 1.200,00',
    status: 'aberto',
    dataCriacao: '2025-04-20T10:30:00Z',
    clienteId: '1',
    nomeCliente: 'João Silva',
    contatoCliente: '(11) 98765-4321',
    propostas: []
  },
  {
    id: '2',
    titulo: 'Pintura interna 3 quartos',
    descricao: 'Apartamento com 3 quartos, sala, cozinha e 2 banheiros precisa de pintura completa. As paredes já estão preparadas, só precisa aplicar a tinta. Material por conta do contratante.',
    categoria: 'pintura',
    endereco: 'Vila Mariana, São Paulo - SP',
    orcamento: 'R$ 2.800,00',
    status: 'em_negociacao',
    dataCriacao: '2025-04-18T14:20:00Z',
    clienteId: '2',
    nomeCliente: 'Maria Oliveira',
    contatoCliente: '(11) 97123-4567',
    propostas: [
      {
        id: 'p1',
        profissionalId: '1',
        nomeProfissional: 'Carlos Ferreira',
        fotoProfissional: '/placeholder.svg',
        especialidadeProfissional: 'Pintor',
        valor: 'R$ 2.500,00',
        prazo: '5 dias',
        mensagem: 'Posso iniciar na próxima semana. Trabalho com pintura há 15 anos e tenho todos os equipamentos necessários. Garanto um serviço de qualidade.',
        status: 'enviada',
        dataCriacao: '2025-04-19T09:15:00Z'
      }
    ]
  },
  {
    id: '3',
    titulo: 'Instalação de ar-condicionado',
    descricao: 'Preciso instalar 2 aparelhos de ar condicionado split (9000 BTUs e 12000 BTUs) em apartamento. Os aparelhos já foram comprados e estão no local.',
    categoria: 'eletrica',
    endereco: 'Moema, São Paulo - SP',
    orcamento: 'R$ 900,00',
    status: 'contratado',
    dataCriacao: '2025-04-15T08:45:00Z',
    clienteId: '3',
    nomeCliente: 'Pedro Santos',
    contatoCliente: '(11) 95555-8888',
    propostas: [
      {
        id: 'p2',
        profissionalId: '2',
        nomeProfissional: 'Ricardo Gomes',
        fotoProfissional: '/placeholder.svg',
        especialidadeProfissional: 'Eletricista',
        valor: 'R$ 850,00',
        prazo: '1 dia',
        mensagem: 'Sou especialista em instalação de ar-condicionado. Posso fazer o serviço ainda esta semana.',
        status: 'aceita',
        dataCriacao: '2025-04-15T10:30:00Z'
      }
    ]
  },
  {
    id: '4',
    titulo: 'Reforma de banheiro',
    descricao: 'Reforma completa de banheiro de 4m². Troca de revestimento, louças e metais. Material por conta do contratante.',
    categoria: 'alvenaria',
    endereco: 'Santana, São Paulo - SP',
    orcamento: null,
    status: 'concluido',
    dataCriacao: '2025-04-10T16:00:00Z',
    clienteId: '4',
    nomeCliente: 'Ana Pereira',
    contatoCliente: '(11) 94444-3333',
    propostas: [
      {
        id: 'p3',
        profissionalId: '3',
        nomeProfissional: 'Roberto Lima',
        fotoProfissional: '/placeholder.svg',
        especialidadeProfissional: 'Pedreiro',
        valor: 'R$ 3.200,00',
        prazo: '8 dias',
        mensagem: 'Trabalho com reformas de banheiro há mais de 20 anos. Posso executar todo o serviço sozinho, do início ao fim.',
        status: 'aceita',
        dataCriacao: '2025-04-11T09:00:00Z'
      }
    ]
  }
];
