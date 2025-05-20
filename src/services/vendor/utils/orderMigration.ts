
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Executa a migração de pedidos da tabela 'orders' para 'pedidos'
 * Isso garante que todos os pedidos sejam corretamente exibidos para os vendedores
 */
export const runOrdersMigration = async (): Promise<{
  success: boolean;
  migratedCount: number;
  message: string;
}> => {
  try {
    console.log("🔄 Iniciando migração de orders para pedidos...");
    
    const { data, error } = await supabase.rpc('run_orders_migration');
    
    if (error) {
      console.error("🚫 Erro ao executar migração de pedidos:", error);
      return {
        success: false,
        migratedCount: 0,
        message: `Erro ao migrar pedidos: ${error.message}`
      };
    }
    
    console.log("✅ Migração de pedidos concluída:", data);
    return {
      success: true,
      migratedCount: data?.migrated_count || 0,
      message: data?.message || 'Migração concluída com sucesso'
    };
  } catch (error) {
    console.error("🚫 Erro inesperado na migração de pedidos:", error);
    return {
      success: false,
      migratedCount: 0,
      message: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
};
