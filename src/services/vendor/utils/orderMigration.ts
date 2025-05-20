
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
    
    // Verificar se data é um objeto e tem as propriedades esperadas
    if (data && typeof data === 'object' && data !== null) {
      // Extrair propriedades seguras usando operador de acesso opcional
      const migrationData = data as Record<string, any>;
      
      // Acessar as propriedades com segurança
      const migratedCount = typeof migrationData.migrated_count === 'number' 
        ? migrationData.migrated_count 
        : 0;
        
      const message = typeof migrationData.message === 'string' 
        ? migrationData.message 
        : 'Migração concluída com sucesso';
      
      return {
        success: true,
        migratedCount: migratedCount,
        message: message
      };
    }
    
    // Caso data não seja o esperado, retornar valores padrão
    return {
      success: true,
      migratedCount: 0,
      message: 'Migração concluída com sucesso'
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
