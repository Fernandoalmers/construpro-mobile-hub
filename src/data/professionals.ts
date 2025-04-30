
import { Professional } from '../types/services';

export const professionalsMock: Professional[] = [
  {
    id: '1',
    nome: 'Carlos Ferreira',
    fotoPerfil: '/placeholder.svg',
    especialidade: 'Pintor',
    especialidades: ['Pintura interna', 'Pintura externa', 'Textura', 'Efeitos decorativos'],
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo',
    estado: 'SP',
    avaliacao: 4.8,
    servicosRealizados: 42,
    sobre: 'Trabalho com pintura há mais de 15 anos. Especialista em pinturas residenciais e comerciais, com acabamento de alta qualidade.',
    areaAtuacao: 'São Paulo e região metropolitana',
    portfolio: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ]
  },
  {
    id: '2',
    nome: 'Ricardo Gomes',
    fotoPerfil: '/placeholder.svg',
    especialidade: 'Eletricista',
    especialidades: ['Instalações elétricas', 'Manutenção preventiva', 'Ar condicionado', 'Iluminação'],
    telefone: '(11) 97123-4567',
    cidade: 'São Paulo',
    estado: 'SP',
    avaliacao: 4.6,
    servicosRealizados: 28,
    sobre: 'Eletricista certificado com 10 anos de experiência. Especialista em instalações residenciais e comerciais, sempre seguindo as normas de segurança.',
    areaAtuacao: 'Zona Sul e Zona Oeste de São Paulo',
    portfolio: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ]
  },
  {
    id: '3',
    nome: 'Roberto Lima',
    fotoPerfil: '/placeholder.svg',
    especialidade: 'Pedreiro',
    especialidades: ['Alvenaria', 'Revestimentos', 'Reformas', 'Acabamentos'],
    telefone: '(11) 96543-2109',
    cidade: 'São Paulo',
    estado: 'SP',
    avaliacao: 4.9,
    servicosRealizados: 53,
    sobre: 'Mais de 20 anos de experiência em construção civil. Especializado em reformas residenciais, com foco em qualidade e satisfação do cliente.',
    areaAtuacao: 'Grande São Paulo',
    portfolio: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ]
  },
  {
    id: '4',
    nome: 'Fernando Costa',
    fotoPerfil: '/placeholder.svg',
    especialidade: 'Marceneiro',
    especialidades: ['Móveis planejados', 'Painéis', 'Cozinhas', 'Armários'],
    telefone: '(11) 95678-9012',
    cidade: 'Guarulhos',
    estado: 'SP',
    avaliacao: 4.7,
    servicosRealizados: 36,
    sobre: 'Marceneiro com 12 anos de experiência. Trabalho com móveis personalizados, focando em qualidade dos materiais e design moderno.',
    areaAtuacao: 'Guarulhos, Zona Norte de São Paulo e região',
    portfolio: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ]
  }
];
