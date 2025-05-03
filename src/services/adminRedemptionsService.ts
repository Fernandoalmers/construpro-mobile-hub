
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminRedemption } from '@/types/admin';

export const fetchAdminRedemptions = async (): Promise<AdminRedemption[]> => {
  try {
    // Check if the resgates table exists
    const { error: tableCheckError } = await supabase
      .from('resgates')
      .select('count')
      .limit(1)
      .single();
    
    // If table doesn't exist, return empty array
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Redemptions table does not exist yet, returning empty data');
      return [];
    }
    
    // Buscar os resgates
    const { data: resgates, error: resgatesError } = await supabase
      .from('resgates')
      .select(`
        id,
        cliente_id,
        item,
        pontos,
        imagem_url,
        codigo,
        status,
        data,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (resgatesError) throw resgatesError;

    // Buscar nomes dos clientes
    const clienteIds = resgates.map(resgate => resgate.cliente_id);
    
    const { data: clientes, error: clientesError } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', clienteIds);
      
    if (clientesError) throw clientesError;

    // Criar um mapa para associar rapidamente IDs de clientes aos seus nomes
    const clienteMap = new Map();
    clientes?.forEach(c => clienteMap.set(c.id, c.nome));

    // Associar nomes de clientes aos resgates
    const resgatesWithClienteNames = resgates.map(resgate => ({
      ...resgate,
      cliente_nome: clienteMap.get(resgate.cliente_id) || 'Cliente Desconhecido'
    })) as AdminRedemption[];
    
    return resgatesWithClienteNames;
  } catch (error) {
    console.error('Error fetching admin redemptions:', error);
    toast.error('Erro ao carregar resgates');
    return [];
  }
};

export const approveRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'aprovado' })
      .eq('id', redemptionId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_redemption',
      entityType: 'resgate',
      entityId: redemptionId,
      details: { status: 'aprovado' }
    });
    
    toast.success('Resgate aprovado com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving redemption:', error);
    toast.error('Erro ao aprovar resgate');
    return false;
  }
};

export const rejectRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    // Primeiro, precisamos obter os detalhes do resgate para restaurar os pontos
    const { data: redemption, error: getError } = await supabase
      .from('resgates')
      .select('cliente_id, pontos')
      .eq('id', redemptionId)
      .single();
      
    if (getError) throw getError;
    
    // Atualizar status do resgate
    const { error: updateError } = await supabase
      .from('resgates')
      .update({ status: 'recusado' })
      .eq('id', redemptionId);
      
    if (updateError) throw updateError;
    
    // Restaurar pontos do cliente
    const { error: pointsError } = await supabase.rpc('adjust_user_points', {
      user_id: redemption.cliente_id,
      points_to_add: redemption.pontos
    });
    
    if (pointsError) throw pointsError;
    
    // Registrar transação de pontos (restauração)
    const { error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: redemption.cliente_id,
        pontos: redemption.pontos,
        tipo: 'restauracao',
        descricao: `Restauração de pontos - Resgate recusado (ID: ${redemptionId})`,
        referencia_id: redemptionId
      });
      
    if (transactionError) {
      console.error('Error registering points restoration transaction:', transactionError);
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_redemption',
      entityType: 'resgate',
      entityId: redemptionId,
      details: { 
        status: 'recusado', 
        pontos_restaurados: redemption.pontos,
        cliente_id: redemption.cliente_id
      }
    });
    
    toast.success('Resgate recusado e pontos restaurados');
    return true;
  } catch (error) {
    console.error('Error rejecting redemption:', error);
    toast.error('Erro ao recusar resgate');
    return false;
  }
};

export const markRedemptionDelivered = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'entregue' })
      .eq('id', redemptionId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'deliver_redemption',
      entityType: 'resgate',
      entityId: redemptionId,
      details: { status: 'entregue' }
    });
    
    toast.success('Resgate marcado como entregue');
    return true;
  } catch (error) {
    console.error('Error marking redemption as delivered:', error);
    toast.error('Erro ao marcar resgate como entregue');
    return false;
  }
};

export const getRedemptionStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'aprovado':
      return 'bg-blue-100 text-blue-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'entregue':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
