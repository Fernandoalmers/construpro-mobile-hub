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
  status: string;
  categorias_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRedemption {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  item: string;
  pontos: number;
  imagem_url: string | null;
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
