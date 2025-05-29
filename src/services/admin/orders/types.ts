
export interface AdminOrderItem {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface AdminOrder {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  loja_id?: string;
  loja_nome?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  data_criacao: string;
  created_at?: string;
  endereco_entrega: any;
  rastreio?: string;
  pontos_ganhos: number;
  items?: AdminOrderItem[];
}
