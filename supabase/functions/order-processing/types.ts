
export interface OrderItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface OrderData {
  id?: string;
  cliente_id: string;
  valor_total: number;
  forma_pagamento: string;
  endereco_entrega: Record<string, any>;
  status?: string;
  rastreio?: string;
  pontos_ganhos: number;
  cupom_codigo?: string | null;
  desconto_aplicado?: number;
  items?: OrderItem[];
}

export interface OrderResponse {
  success: boolean;
  order?: {
    id: string;
    [key: string]: any;
  };
  error?: string;
  inventoryUpdated?: boolean;
  pointsRegistered?: boolean;
  couponProcessed?: boolean;
}
