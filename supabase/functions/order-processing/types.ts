
export interface OrderItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Order {
  id?: string;
  valor_total: number;
  forma_pagamento: string;
  endereco_entrega: Record<string, any>;
  status?: string;
  rastreio?: string;
  items: OrderItem[];
}
