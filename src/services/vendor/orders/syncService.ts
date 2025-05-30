
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  errors: string[];
}

export class OrderSyncService {
  
  /**
   * Sincronização melhorada de pedidos
   */
  async syncMissingOrders(): Promise<SyncResult> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      console.log('🔄 [OrderSyncService] Iniciando sincronização de pedidos...');
      
      // Primeiro, verificar se há pedidos não sincronizados
      const { data: missingOrders, error: checkError } = await supabase.rpc('check_sync_integrity');
      
      if (checkError) {
        console.error('❌ [OrderSyncService] Erro ao verificar integridade:', checkError);
        errors.push(`Erro ao verificar integridade: ${checkError.message}`);
        return { success: false, syncedCount: 0, message: 'Erro na verificação', errors };
      }

      const integrityCheck = missingOrders?.[0];
      if (!integrityCheck || integrityCheck.missing_pedidos === 0) {
        return { 
          success: true, 
          syncedCount: 0, 
          message: 'Todos os pedidos já estão sincronizados', 
          errors: [] 
        };
      }

      console.log(`📊 [OrderSyncService] Encontrados ${integrityCheck.missing_pedidos} pedidos para sincronizar`);

      // Executar migração melhorada
      const { data: migrationResult, error: migrationError } = await supabase.rpc('migrate_missing_orders_to_pedidos');
      
      if (migrationError) {
        console.error('❌ [OrderSyncService] Erro na migração:', migrationError);
        errors.push(`Erro na migração: ${migrationError.message}`);
        return { success: false, syncedCount: 0, message: 'Erro na migração', errors };
      }

      syncedCount = migrationResult || 0;
      console.log(`✅ [OrderSyncService] Sincronizados ${syncedCount} pedidos`);

      // Verificar novamente após sincronização
      const { data: postSyncCheck } = await supabase.rpc('check_sync_integrity');
      const postSync = postSyncCheck?.[0];
      
      if (postSync && postSync.missing_pedidos > 0) {
        console.warn(`⚠️ [OrderSyncService] Ainda há ${postSync.missing_pedidos} pedidos não sincronizados`);
        errors.push(`${postSync.missing_pedidos} pedidos ainda não sincronizados`);
      }

      return {
        success: true,
        syncedCount,
        message: syncedCount > 0 
          ? `${syncedCount} pedidos sincronizados com sucesso` 
          : 'Nenhum pedido precisava ser sincronizado',
        errors
      };

    } catch (error) {
      console.error('❌ [OrderSyncService] Erro inesperado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(errorMessage);
      
      return {
        success: false,
        syncedCount: 0,
        message: 'Erro durante a sincronização',
        errors
      };
    }
  }

  /**
   * Verificação de integridade melhorada
   */
  async checkIntegrity() {
    try {
      const { data, error } = await supabase.rpc('check_sync_integrity');
      
      if (error) {
        console.error('❌ [OrderSyncService] Erro ao verificar integridade:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ [OrderSyncService] Erro inesperado na verificação:', error);
      return null;
    }
  }

  /**
   * Força uma nova verificação e sincronização
   */
  async forceSync(): Promise<SyncResult> {
    console.log('🔧 [OrderSyncService] Executando sincronização forçada...');
    
    // Aguardar um pouco para dar tempo ao banco processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.syncMissingOrders();
  }
}

export const orderSyncService = new OrderSyncService();
