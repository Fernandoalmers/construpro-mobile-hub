export interface UserData {
  id: string;
  nome?: string;
  email?: string;
  papel?: string;
  tipo_perfil?: string;
  status?: string;
  cpf?: string;
  telefone?: string;
  avatar?: string | null;
  is_admin?: boolean;
  saldo_pontos?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  created_at: string;
}

export interface AdminStats {
  users: {
    total: number;
    pending: number;
  };
  products: {
    total: number;
    pending: number;
  };
  stores: {
    total: number;
    pending: number;
  };
  redemptions: {
    total: number;
    pending: number;
  };
}

export interface AdminCategory {
  id: string;
  nome: string;
  segment_id?: string;
  segment_name?: string;
  status: string; 
  produtos_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSegment {
  id: string;
  nome: string;
  image_url?: string | null;
  status: string;
  categorias_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRedemption {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  item: string;
  pontos: number;
  imagem_url: string;
  codigo: string | null;
  status: "recusado" | "pendente" | "aprovado" | "entregue";
  data: string;
  created_at: string;
  updated_at: string;
}

export interface AdminReward {
  id: string;
  nome: string;
  descricao: string;
  pontos: number;
  imagem_url: string | null;
  categoria: string;
  status: string;
  estoque: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagemUrl: string | null;
  preco: number;
  preco_normal: number;
  preco_promocional?: number;
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
  /** Join com a tabela `vendedores` para acessar nome da loja */
  vendedores?: {
    nome_loja?: string;
  } | null;
}

export interface AdminStore {
  id: string;
  nome: string;
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
