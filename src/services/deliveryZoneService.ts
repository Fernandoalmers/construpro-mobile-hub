
import { supabase } from '@/integrations/supabase/client';

// Use the correct type from the database
export type DeliveryZone = {
  zone_id: string;
  vendor_id: string;
  zone_name: string;
  delivery_fee: number;
  delivery_time: string;
};

export interface UserDeliveryContext {
  user_id: string;
  current_cep: string;
  resolved_zones: DeliveryZone[];
  last_updated: string;
}

class DeliveryZoneService {
  /**
   * Resolve delivery zones for a user's CEP
   */
  async resolveUserZones(userCep: string): Promise<DeliveryZone[]> {
    try {
      console.log('[DeliveryZoneService] 🔍 Resolving zones for CEP:', userCep);
      
      const { data, error } = await supabase.rpc('resolve_delivery_zones', {
        user_cep: userCep
      });

      if (error) {
        console.error('[DeliveryZoneService] ❌ Error resolving zones:', error);
        throw error;
      }

      console.log('[DeliveryZoneService] ✅ Zones resolved:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[DeliveryZoneService] 💥 Exception resolving zones:', error);
      throw error;
    }
  }

  /**
   * Save user delivery context with error handling
   */
  async saveUserDeliveryContext(
    cep: string, 
    zones: DeliveryZone[], 
    userId?: string
  ): Promise<void> {
    if (!userId) {
      console.log('[DeliveryZoneService] ⚠️ No user ID, skipping context save');
      return;
    }

    try {
      console.log('[DeliveryZoneService] 💾 Saving delivery context for user:', userId);
      
      const contextData = {
        user_id: userId,
        current_cep: cep,
        resolved_zones: zones,
        last_updated: new Date().toISOString()
      };

      // Use upsert to handle the unique constraint
      const { error } = await supabase
        .from('user_delivery_context')
        .upsert(contextData, { onConflict: 'user_id' });

      if (error) {
        console.warn('[DeliveryZoneService] ⚠️ Non-critical error saving context:', error);
        // Don't throw - context saving is not critical for functionality
      } else {
        console.log('[DeliveryZoneService] ✅ Context saved successfully');
      }
    } catch (error) {
      console.warn('[DeliveryZoneService] ⚠️ Non-critical exception saving context:', error);
      // Don't throw - context saving is not critical for functionality
    }
  }

  /**
   * Get saved user delivery context
   */
  async getUserDeliveryContext(userId: string): Promise<UserDeliveryContext | null> {
    try {
      console.log('[DeliveryZoneService] 📖 Getting delivery context for user:', userId);
      
      const { data, error } = await supabase
        .from('user_delivery_context')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[DeliveryZoneService] ❌ Error getting context:', error);
        return null;
      }

      if (data) {
        console.log('[DeliveryZoneService] ✅ Context found:', data.current_cep);
        return data as UserDeliveryContext;
      }

      console.log('[DeliveryZoneService] ℹ️ No context found for user');
      return null;
    } catch (error) {
      console.error('[DeliveryZoneService] 💥 Exception getting context:', error);
      return null;
    }
  }
}

export const deliveryZoneService = new DeliveryZoneService();
