
import { CartItem } from '@/types/cart';

// Define the address structure that matches what we're sending
export interface OrderAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ponto_referencia?: string;
}

export interface CreateOrderPayload {
  items: CartItem[];
  endereco_entrega: OrderAddress;
  forma_pagamento: string;
  valor_total: number;
  pontos_ganhos: number;
  cupom_aplicado?: {code: string, discount: number} | null;
  desconto?: number;
}

export interface ProductData {
  id: string;
  nome: string;
  imagens: string[];
  imagem_url: string | null;
  descricao: string;
  preco_normal: number;
  categoria: string;
  preco_promocional?: number;
}

export interface OrderItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal?: number;
  pontos?: number;
  produto?: ProductData;
}

export interface OrderData {
  id: string;
  cliente_id: string;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  valor_total: number;
  pontos_ganhos: number;
  created_at: string;
  updated_at?: string;
  rastreio?: string;
  items: OrderItem[];
  // Novos campos para desconto de cupom
  desconto_aplicado?: number;
  cupom_codigo?: string;
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
