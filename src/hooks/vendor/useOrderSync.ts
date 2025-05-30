
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { orderSyncService } from '@/services/vendor/orders/syncService';

export const useOrderSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const checkSyncIntegrity = useCallback(async () => {
    setIsCheckingIntegrity(true);
    try {
      const status = await orderSyncService.checkIntegrity();
      setSyncStatus(status);
      
      if (status) {
        console.log('🔍 [useOrderSync] Status de sincronização:', status);
        
        if (status.sync_status === 'SYNC_CRITICAL') {
          toast.error(`Sincronização crítica: ${status.missing_pedidos} pedidos não sincronizados!`, {
            duration: 8000
          });
        } else if (status.sync_status === 'SYNC_WARNING') {
          toast.warning(`Aviso: ${status.missing_pedidos} pedidos não sincronizados`, {
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('❌ [useOrderSync] Erro ao verificar integridade:', error);
      toast.error('Erro ao verificar sincronização');
    } finally {
      setIsCheckingIntegrity(false);
    }
  }, []);

  const syncOrders = useCallback(async (force = false) => {
    setIsSyncing(true);
    try {
      toast.loading('Sincronizando pedidos...', { id: 'sync-toast' });
      
      const result = force 
        ? await orderSyncService.forceSync()
        : await orderSyncService.syncMissingOrders();
      
      toast.dismiss('sync-toast');
      
      if (result.success) {
        if (result.syncedCount > 0) {
          toast.success(`✅ ${result.message}`, {
            description: `${result.syncedCount} pedidos sincronizados`,
            duration: 5000
          });
        } else {
          toast.success(result.message);
        }
        
        // Verificar integridade após sincronização
        await checkSyncIntegrity();
      } else {
        toast.error('❌ Erro na sincronização', {
          description: result.message,
          duration: 8000
        });
        
        if (result.errors.length > 0) {
          console.error('❌ [useOrderSync] Erros de sincronização:', result.errors);
        }
      }
      
      return result;
    } catch (error) {
      toast.dismiss('sync-toast');
      console.error('❌ [useOrderSync] Erro na sincronização:', error);
      toast.error('Erro inesperado durante a sincronização');
      return { success: false, syncedCount: 0, message: 'Erro inesperado', errors: [] };
    } finally {
      setIsSyncing(false);
    }
  }, [checkSyncIntegrity]);

  const forceSyncOrders = useCallback(() => {
    return syncOrders(true);
  }, [syncOrders]);

  return {
    isSyncing,
    isCheckingIntegrity,
    syncStatus,
    checkSyncIntegrity,
    syncOrders,
    forceSyncOrders
  };
};
