
import { CartItem } from '@/types/cart';
import { Address } from '@/services/addressService';

export interface CreateOrderPayload {
  items: CartItem[];
  endereco_entrega: Address;
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
