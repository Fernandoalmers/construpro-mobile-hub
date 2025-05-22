
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches customer points from the profiles table
 */
export const getCustomerPoints = async (userId: string) => {
  try {
    console.log('Fetching points for user ID:', userId);
    
    if (!userId) {
      console.warn('No user ID provided to getCustomerPoints');
      return 0;
    }
    
    // First, check if this is a usuario_id or a relation id
    const isFullUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isFullUUID) {
      console.warn('Invalid UUID format for user ID:', userId);
      return 0;
    }
    
    // Get the actual user ID from clientes_vendedor if needed
    let actualUserId = userId;
    
    // Check if this is a relation ID and get the real user ID
    const { data: relation } = await supabase
      .from('clientes_vendedor')
      .select('usuario_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (relation?.usuario_id) {
      console.log('Found relation, using usuario_id:', relation.usuario_id);
      actualUserId = relation.usuario_id;
    }
    
    // Now get the points from the profiles table with cache busting
    const timestamp = new Date().getTime();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', actualUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching customer points:', error);
      toast.error('Erro ao buscar pontos do cliente');
      return 0;
    }
    
    console.log('Customer points data:', profile);
    return profile?.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    toast.error('Erro ao buscar pontos do cliente');
    return 0;
  }
};
