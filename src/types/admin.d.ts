
// If this file doesn't exist, create it with these types

export interface AdminProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagemUrl?: string | null;
  preco: number;
  preco_normal: number;
  preco_promocional?: number | null;
  estoque: number;
  pontos: number;
  pontos_consumidor: number;
  pontos_profissional?: number;
  lojaId: string;
  vendedor_id: string;
  lojaNome: string;
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
  updated_at?: string;
  imagens?: string[];
  vendedores?: {
    nome_loja?: string;
  };
}

export interface AdminRedemption {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  item: string;
  pontos: number;
  imagem_url?: string;
  codigo: string | null;
  status: 'pendente' | 'aprovado' | 'recusado' | 'entregue';
  data: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStore {
  id: string;
  nome: string;
  nome_loja?: string;
  logo_url: string | null;
  banner_url?: string | null;
  descricao?: string;
  proprietario_id: string;
  proprietario_nome?: string;
  status: string;
  produtos_count: number;
  contato?: string;
  created_at: string;
  updated_at: string;
}

