
import { supabase } from '@/integrations/supabase/client';
import { createOrder } from './order/createOrder';
import { getOrders } from './order/getOrders';
import { getOrderById, getOrderByIdDirect } from './order/getOrderById';
import { OrderData, CreateOrderPayload, OrderResponse } from './order/types';

export const orderService = {
  async createOrder(orderData: CreateOrderPayload): Promise<OrderResponse> {
    try {
      const orderId = await createOrder(orderData);
      if (orderId) {
        return {
          success: true,
          order: { id: orderId }
        };
      } else {
        return {
          success: false,
          error: 'Failed to create order'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
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

  // Enhanced method that uses the improved RPC function with better error handling
  async getOrderByIdRPC(orderId: string): Promise<OrderData | null> {
    try {
      console.log(`🔍 [orderService.getOrderByIdRPC] Fetching order: ${orderId}`);
      
      const { data, error } = await supabase.rpc('get_order_by_id', { 
        p_order_id: orderId 
      });
      
      if (error) {
        console.error('❌ [orderService.getOrderByIdRPC] RPC error:', error);
        throw error;
      }
      
      if (!data) {
        console.log(`⚠️ [orderService.getOrderByIdRPC] No order found for ID: ${orderId}`);
        return null;
      }
      
      // Safely cast the Json response to OrderData
      const orderData = data as unknown as OrderData;
      console.log(`✅ [orderService.getOrderByIdRPC] Successfully retrieved order with ${orderData.items?.length || 0} items`);
      return orderData;
      
    } catch (error) {
      console.error('❌ [orderService.getOrderByIdRPC] Error:', error);
      throw error;
    }
  }
};
