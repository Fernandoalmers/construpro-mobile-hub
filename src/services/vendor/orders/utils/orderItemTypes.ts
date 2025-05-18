
import { ProductData } from './productTypes';

// Simple standalone type for order items
export interface SimpleOrderItem {
  id: string;
  order_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  total: number;
  created_at?: string;
  produto?: ProductData | null;
}

// Explicit interface for order item records
export interface OrderItemRecord {
  id: string;
  order_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at?: string;
}
