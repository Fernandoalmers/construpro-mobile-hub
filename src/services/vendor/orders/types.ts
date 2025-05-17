
import { VendorCustomer } from '../../vendorCustomersService';

export interface OrderItem {
  id: string;
  pedido_id?: string;
  order_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  subtotal?: number;
  created_at?: string;
  produto?: any;
  produtos?: any;
}

export interface VendorOrder {
  id: string;
  vendedor_id?: string;
  usuario_id?: string;
  cliente_id?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  data_entrega_estimada?: string;
  cliente?: VendorCustomer;
  itens?: OrderItem[];
}
