
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('Fetching admin stores from vendedores table...');
    
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        usuario_id,
        status,
        descricao,
        telefone,
        whatsapp,
        logo,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }

    console.log('Admin stores data from vendedores:', data);
    
    // Transform data to AdminStore format
    const stores: AdminStore[] = data.map(store => ({
      id: store.id,
      nome: store.nome_loja,
      descricao: store.descricao || '',
      logo_url: store.logo || '',
      proprietario_id: store.usuario_id,
      status: store.status || 'pendente',
      created_at: store.created_at,
      updated_at: store.updated_at,
      produtos_count: 0,  // Add default value for produtos_count
      contato: store.telefone || store.whatsapp || undefined
    }));
    
    console.log('Admin stores loaded:', stores);
    return stores;
  } catch (error) {
    console.error('Error in getAdminStores:', error);
    toast.error('Erro ao carregar lojas');
    return [];
  }
};

/**
 * Fetch pending stores for admin approval
 */
export const getAdminPendingStores = async (): Promise<AdminStore[]> => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        usuario_id,
        status,
        descricao,
        telefone,
        logo,
        created_at,
        updated_at
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching pending stores:', error);
      throw error;
    }
    
    // Transform data to AdminStore format
    const stores: AdminStore[] = data.map(store => ({
      id: store.id,
      nome: store.nome_loja,
      descricao: store.descricao || '',
      logo_url: store.logo || '',
      proprietario_id: store.usuario_id,
      status: store.status || 'pendente',
      created_at: store.created_at,
      updated_at: store.updated_at,
      produtos_count: 0,  // Add default value for produtos_count
      contato: store.telefone || undefined
    }));
    
    return stores;
  } catch (error) {
    console.error('Error in getAdminPendingStores:', error);
    toast.error('Erro ao carregar lojas pendentes');
    return [];
  }
};
