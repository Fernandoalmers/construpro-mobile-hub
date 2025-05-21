
import { Address } from '../addressService';
import { CartItem } from '@/types/cart';
import { VendorOrder } from '../vendor/orders/types';

export interface CreateOrderPayload {
  items: CartItem[];
  endereco_entrega: Address;
  forma_pagamento: string;
  valor_total: number;
  pontos_ganhos: number;
}

export interface OrderResponse {
  success?: boolean;
  order?: {
    id: string;
    [key: string]: any;
  };
  error?: string;
}

export interface OrderData {
  id: string;
  cliente_id?: string;
  valor_total: number;
  pontos_ganhos?: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  updated_at?: string;
  rastreio?: string;
  items?: OrderItem[];
  [key: string]: any;
}

export interface OrderItem {
  id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal?: number;
  produto?: {
    id: string;
    nome: string;
    preco_normal?: number;
    preco_promocional?: number;
    imagem_url?: string | null;
    imagens?: string[] | {url?: string, path?: string}[] | any; // Updated to make this more flexible
    descricao?: string;
    categoria?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProductData {
  id: string;
  nome: string;
  imagens?: any[]; // Updated to match with Json type from Supabase
  preco_normal: number;
  preco_promocional?: number;
  descricao?: string;
  categoria?: string;
  imagem_url?: string | null; // Added imagem_url to be consistent
  [key: string]: any;
}

export type OrdersMap = Record<string, OrderData>;
