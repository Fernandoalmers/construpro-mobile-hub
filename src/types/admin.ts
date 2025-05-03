
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
