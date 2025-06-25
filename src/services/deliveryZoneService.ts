
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
      if (data && data.length > 0) {
        console.log('[deliveryZoneService] Detalhes das zonas:', data);
      } else {
        console.log('[deliveryZoneService] ⚠️ Nenhuma zona encontrada para CEP:', cep);
        // Verificar se existem zonas cadastradas no sistema
        const { data: allZones } = await supabase
          .from('vendor_delivery_zones')
          .select('zone_name, zone_type, zone_value, vendor_id')
          .eq('active', true)
          .limit(5);
        
        console.log('[deliveryZoneService] Zonas cadastradas no sistema:', allZones?.length || 0);
        if (allZones && allZones.length > 0) {
          console.log('[deliveryZoneService] Exemplos de zonas:', allZones);
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('[deliveryZoneService] Erro inesperado:', error);
      // Retornar array vazio para manter o sistema funcionando
      return [];
    }
  },

  /**
   * Salva o contexto de entrega do usuário - CORRIGIDO para usar constraint correta
   */
  async saveUserDeliveryContext(
    cep: string, 
    zones: DeliveryZone[], 
    userId?: string
  ): Promise<void> {
    console.log('[deliveryZoneService] Salvando contexto de entrega');
    console.log('[deliveryZoneService] Dados:', { cep, zonesCount: zones.length, userId });
    
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

      console.log('[deliveryZoneService] Tentando salvar contexto:', contextData);
      
      // CORRIGIDO: Usar upsert mais específico baseado em user_id OU session_id
      if (userId) {
        // Para usuários autenticados, usar user_id
        const { data, error } = await supabase
          .from('user_delivery_context')
          .upsert(contextData, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
          
        if (error) {
          console.warn('[deliveryZoneService] Erro ao salvar contexto por user_id, tentando INSERT:', error);
          // Tentar INSERT direto se upsert falhar
          const { error: insertError } = await supabase
            .from('user_delivery_context')
            .insert(contextData);
          
          if (insertError) {
            console.warn('[deliveryZoneService] Aviso ao inserir contexto:', insertError);
          } else {
            console.log('[deliveryZoneService] ✅ Contexto inserido com sucesso via INSERT');
          }
        } else {
          console.log('[deliveryZoneService] ✅ Contexto salvo com sucesso via UPSERT:', data?.id);
        }
      } else {
        // Para usuários não autenticados, usar session_id
        const { data, error } = await supabase
          .from('user_delivery_context')
          .insert(contextData)
          .select()
          .single();
          
        if (error) {
          console.warn('[deliveryZoneService] Aviso ao salvar contexto por session:', error);
        } else {
          console.log('[deliveryZoneService] ✅ Contexto de sessão salvo:', data?.id);
        }
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
    console.log('[deliveryZoneService] Recuperando contexto de entrega para:', userId || 'sessão');
    
    try {
      let query = supabase
        .from('user_delivery_context')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        const sessionId = localStorage.getItem('delivery_session_id');
        if (sessionId) {
          query = query.eq('session_id', sessionId);
        } else {
          console.log('[deliveryZoneService] Nenhuma sessão encontrada para recuperar contexto');
          return null;
        }
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('[deliveryZoneService] Aviso ao recuperar contexto:', error);
        return null;
      }
      
      if (data) {
        console.log('[deliveryZoneService] ✅ Contexto recuperado:', {
          id: data.id,
          cep: data.current_cep,
          zonesCount: data.resolved_zone_ids?.length || 0
        });
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
