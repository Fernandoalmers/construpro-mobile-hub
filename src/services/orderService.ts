
import { supabase } from '@/integrations/supabase/client';
import { createOrder } from './order/createOrder';
import { getOrders } from './order/getOrders';
import { getOrderById, getOrderByIdDirect } from './order/getOrderById';
import { OrderData, CreateOrderPayload, OrderResponse } from './order/types';

export const orderService = {
  async createOrder(orderData: CreateOrderPayload): Promise<OrderResponse> {
    return createOrder(orderData);
  },

  async getOrders(): Promise<OrderData[]> {
    return getOrders();
  },

  async getOrderById(orderId: string): Promise<OrderData | null> {
    return getOrderById(orderId);
  },

  async getOrderByIdDirect(orderId: string): Promise<OrderData | null> {
    return getOrderByIdDirect(orderId);
  },

  // Enhanced method that uses the improved RPC function
  async getOrderByIdRPC(orderId: string): Promise<OrderData | null> {
    try {
      console.log(`🔍 [orderService.getOrderByIdRPC] Fetching order: ${orderId}`);
      
      const { data, error } = await supabase.rpc('get_order_by_id', { 
        order_id: orderId 
      });
      
      if (error) {
        console.error('❌ [orderService.getOrderByIdRPC] RPC error:', error);
        throw error;
      }
      
      if (!data) {
        console.log(`⚠️ [orderService.getOrderByIdRPC] No order found for ID: ${orderId}`);
        return null;
      }
      
      console.log(`✅ [orderService.getOrderByIdRPC] Successfully retrieved order with ${data.items?.length || 0} items`);
      return data as OrderData;
      
    } catch (error) {
      console.error('❌ [orderService.getOrderByIdRPC] Error:', error);
      throw error;
    }
  }
};
