
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryZone {
  zone_id: string;
  vendor_id: string;
  zone_name: string;
  delivery_fee: number;
}

export interface UserDeliveryContext {
  id: string;
  user_id?: string;
  session_id?: string;
  current_cep: string;
  current_city?: string;
  current_state?: string;
  resolved_zone_ids: string[];
  last_resolved_at: string;
}

export const deliveryZoneService = {
  /**
   * Resolve zonas de entrega baseado no CEP do usuário
   */
  async resolveUserZones(cep: string): Promise<DeliveryZone[]> {
    console.log('[deliveryZoneService] Resolvendo zonas para CEP:', cep);
    
    try {
      const { data, error } = await supabase.rpc('resolve_delivery_zones', {
        user_cep: cep
      });
      
      if (error) {
        console.error('[deliveryZoneService] Erro ao resolver zonas:', error);
        // Retornar array vazio em vez de falhar para manter o sistema funcionando
        return [];
      }
      
      console.log('[deliveryZoneService] Zonas encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[deliveryZoneService] Erro inesperado:', error);
      // Retornar array vazio para manter o sistema funcionando
      return [];
    }
  },

  /**
   * Salva o contexto de entrega do usuário
   */
  async saveUserDeliveryContext(
    cep: string, 
    zones: DeliveryZone[], 
    userId?: string
  ): Promise<void> {
    console.log('[deliveryZoneService] Salvando contexto de entrega');
    
    try {
      const sessionId = userId ? null : crypto.randomUUID();
      const zoneIds = zones.map(z => z.zone_id);
      
      const contextData = {
        user_id: userId || null,
        session_id: sessionId,
        current_cep: cep,
        resolved_zone_ids: zoneIds,
        last_resolved_at: new Date().toISOString()
      };
      
      // Tentar salvar contexto, mas não falhar se houver erro
      const { error } = await supabase
        .from('user_delivery_context')
        .upsert(contextData, {
          onConflict: userId ? 'user_id' : 'session_id'
        });
      
      if (error) {
        console.warn('[deliveryZoneService] Aviso ao salvar contexto:', error);
        // Não fazer throw para não quebrar o fluxo principal
      }
    } catch (error) {
      console.warn('[deliveryZoneService] Aviso inesperado ao salvar contexto:', error);
      // Não fazer throw para não quebrar o fluxo principal
    }
  },

  /**
   * Recupera o contexto de entrega salvo
   */
  async getUserDeliveryContext(userId?: string): Promise<UserDeliveryContext | null> {
    console.log('[deliveryZoneService] Recuperando contexto de entrega');
    
    try {
      const { data, error } = await supabase
        .from('user_delivery_context')
        .select('*')
        .eq(userId ? 'user_id' : 'session_id', userId || localStorage.getItem('delivery_session_id'))
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('[deliveryZoneService] Aviso ao recuperar contexto:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.warn('[deliveryZoneService] Aviso inesperado ao recuperar contexto:', error);
      return null;
    }
  },

  /**
   * Limpa CEP formatado para comparação
   */
  cleanCep(cep: string): string {
    return cep.replace(/[^0-9]/g, '');
  }
};
