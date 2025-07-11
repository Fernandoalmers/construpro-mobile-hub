
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryZone {
  id: string;
  zone_name: string;
  zone_type: string;
  delivery_time: string;
  cep_ranges?: string[];
  ibge_code?: string;
}

export interface UserDeliveryContext {
  user_id: string;
  session_id?: string;
  current_cep: string;
  resolved_zone_ids: string[];
  last_resolved_at: string;
}

export const deliveryZoneService = {
  async resolveUserZones(cep: string): Promise<DeliveryZone[]> {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!cleanCep || cleanCep.length !== 8) {
      console.warn('CEP inválido para resolução de zonas:', cep);
      return [];
    }
    
    console.log('Resolvendo zonas para CEP:', cleanCep);
    
    try {
      const { data: zones, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('zone_name');
      
      if (error) {
        console.error('Erro ao buscar zonas de entrega:', error);
        return [];
      }
      
      const resolvedZones = zones || [];
      console.log('Zonas encontradas:', resolvedZones.length);
      console.log('Detalhes das zonas:', resolvedZones);
      
      return resolvedZones;
    } catch (error) {
      console.error('Erro geral ao resolver zonas:', error);
      return [];
    }
  },

  async saveUserDeliveryContext(cep: string, zones: DeliveryZone[], userId?: string): Promise<void> {
    if (!userId) {
      console.log('Sem userId, pulando salvamento do contexto');
      return;
    }

    console.log('Salvando contexto de entrega');
    console.log('Dados:', {
      cep,
      zonesCount: zones.length,
      userId
    });

    const contextData: UserDeliveryContext = {
      user_id: userId,
      session_id: null,
      current_cep: cep.replace(/\D/g, ''),
      resolved_zone_ids: zones.map(z => z.id),
      last_resolved_at: new Date().toISOString()
    };

    try {
      console.log('Tentando upsert com nova constraint única:', contextData);
      
      // Now we can use upsert since we have the unique constraint
      const { data, error } = await supabase
        .from('user_delivery_context')
        .upsert(contextData, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro no upsert do contexto:', error);
        throw error;
      }

      console.log('✅ Contexto salvo/atualizado com sucesso:', data);
    } catch (error) {
      console.error('❌ Erro ao salvar contexto de entrega:', error);
      // Don't throw - this shouldn't block the main flow
    }
  }
};
