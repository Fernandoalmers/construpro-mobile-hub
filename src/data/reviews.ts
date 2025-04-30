
import { ProfessionalReview } from '../types/services';

export const reviewsMock: ProfessionalReview[] = [
  {
    id: '1',
    profissionalId: '3',
    clienteId: '4',
    nomeCliente: 'Ana Pereira',
    nota: 5,
    comentario: 'Excelente trabalho na reforma do meu banheiro. O Roberto é muito profissional, pontual e cuidadoso com os detalhes. O resultado ficou melhor do que eu esperava. Super recomendo!',
    data: '2025-04-20',
    servicoRealizado: 'Reforma de banheiro',
    projetoId: '2'
  },
  {
    id: '2',
    profissionalId: '3',
    clienteId: '5',
    nomeCliente: 'Lucas Oliveira',
    nota: 5,
    comentario: 'Contratei o Roberto para reforma da minha cozinha. Entregou o serviço no prazo combinado e com excelente qualidade. Muito honesto e dedicado.',
    data: '2025-04-15',
    servicoRealizado: 'Reforma de cozinha',
    projetoId: '5'
  },
  {
    id: '3',
    profissionalId: '3',
    clienteId: '6',
    nomeCliente: 'Mariana Santos',
    nota: 4,
    comentario: 'O Roberto fez um bom trabalho na reforma do meu apartamento. Atrasou um pouco a entrega, mas o resultado final valeu a pena. Recomendo.',
    data: '2025-04-05',
    servicoRealizado: 'Reforma de apartamento',
    projetoId: '6'
  },
  {
    id: '4',
    profissionalId: '1',
    clienteId: '7',
    nomeCliente: 'José Silva',
    nota: 5,
    comentario: 'O Carlos fez um trabalho impecável na pintura da minha casa. Cores conforme combinado, acabamento perfeito e limpeza total após o serviço. Já o indiquei para vários amigos!',
    data: '2025-04-18',
    servicoRealizado: 'Pintura residencial',
    projetoId: '7'
  },
  {
    id: '5',
    profissionalId: '2',
    clienteId: '8',
    nomeCliente: 'Fernanda Costa',
    nota: 4,
    comentario: 'O Ricardo instalou toda a parte elétrica da minha casa nova. Trabalho muito bem feito e seguindo todas as normas de segurança. Recomendo!',
    data: '2025-04-12',
    servicoRealizado: 'Instalação elétrica',
    projetoId: '8'
  }
];
