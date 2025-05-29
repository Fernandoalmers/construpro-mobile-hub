
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

export interface OrderItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal?: number;
  pontos?: number;
}

export interface OrderData {
  cliente_id: string;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  valor_total: number;
  pontos_ganhos: number;
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
