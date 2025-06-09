
export interface LoyaltyStats {
  totalUsers: number;
  activeUsers: number;
  totalPointsInCirculation: number;
  averagePointsPerUser: number;
  topUserPoints: number;
  totalTransactions: number;
  totalAdjustments: number;
}

export interface UserRanking {
  id: string;
  nome: string;
  email: string;
  saldo_pontos: number;
  nivel: string;
  total_transacoes: number;
  ultima_atividade: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  pontos: number;
  tipo: string;
  descricao: string;
  data: string;
  reference_code?: string;
}

export interface VendorAdjustment {
  id: string;
  vendedor_id: string;
  vendedor_nome: string;
  usuario_id: string;
  usuario_nome: string;
  valor: number;
  tipo: string;
  motivo: string;
  created_at: string;
}

export interface VendorAdjustmentSummary {
  vendedor_id: string;
  vendedor_nome: string;
  total_ajustes: number;
  pontos_adicionados: number;
  pontos_removidos: number;
  ultimo_ajuste: string;
}
