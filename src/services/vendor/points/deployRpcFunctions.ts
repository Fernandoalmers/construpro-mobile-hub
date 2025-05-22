
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Deploys RPC functions by calling the create-rpc-functions edge function
 */
export const deployPointsRpcFunctions = async (): Promise<boolean> => {
  try {
    console.log('Deploying RPC functions for points adjustment system...');
    
    const { data, error } = await supabase.functions.invoke('create-rpc-functions', {
      method: 'POST',
    });
    
    if (error) {
      console.error('Error deploying RPC functions:', error);
      toast.error('Erro ao configurar funções RPC: ' + error.message);
      return false;
    }
    
    console.log('RPC functions deployed successfully:', data);
    toast.success('Funções RPC configuradas com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error in deployPointsRpcFunctions:', error);
    toast.error(`Erro ao configurar funções RPC: ${error?.message || 'Verifique o console para detalhes'}`);
    return false;
  }
};
