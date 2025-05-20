
import { VendorCustomer } from '../../vendorCustomersService';

export interface OrderFilters {
  status?: string | string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  searchTerm?: string;
}

export interface OrderItem {
  id: string;
  pedido_id?: string; // Legacy field
  order_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  subtotal?: number;
  created_at?: string;
  produto?: any;
  produtos?: any; // Keep this for backward compatibility
}

export interface VendorOrder {
  id: string;
  vendedor_id?: string;
  usuario_id?: string; // Legacy field
  cliente_id?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  data_criacao?: string;
  data_entrega_estimada?: string;
  pontos_ganhos?: number;
  rastreio?: string; // Made optional as it doesn't exist in the database
  cliente?: VendorCustomer;
  itens?: OrderItem[];
  items?: OrderItem[]; // Alias for itens for compatibility
}
