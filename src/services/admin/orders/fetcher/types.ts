
export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface FetchOrdersResult {
  orders: any[];
  totalCount: number;
  hasMore: boolean;
}

export interface OrderQueryResult {
  id: string;
  cliente_id: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  data_criacao: string;
  created_at: string;
  endereco_entrega: any;
  rastreio?: string;
  pontos_ganhos: number;
}
