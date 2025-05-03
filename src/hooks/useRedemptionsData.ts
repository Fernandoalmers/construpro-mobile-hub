
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface Redemption {
  id: string;
  item: string;
  pontos: number;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  status: 'pendente' | 'aprovado' | 'recusado' | 'entregue';
  codigo?: string;
  imagem_url?: string;
  data: string;
  created_at: string;
  updated_at?: string;
}

export const useRedemptionsData = (filters?: { 
  status?: string; 
  clienteId?: string;
  limit?: number;
}) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRedemptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('resgates')
        .select(`
          *,
          profiles:cliente_id (nome, email)
        `);
      
      // Apply filters if they exist
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.clienteId) {
        query = query.eq('cliente_id', filters.clienteId);
      }
      
      // Order by creation date, newest first
      query = query.order('created_at', { ascending: false });
      
      // Apply limit if specified
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Transform the data to include cliente_nome and cliente_email
      const transformedData = data.map(item => ({
        ...item,
        cliente_nome: item.profiles?.nome || 'Cliente desconhecido',
        cliente_email: item.profiles?.email || 'Email não disponível'
      }));
      
      setRedemptions(transformedData);
    } catch (err: any) {
      console.error('Error fetching redemptions:', err);
      setError(err.message || 'Erro ao carregar resgates');
      toast.error('Falha ao carregar resgates');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRedemptions();
    
    // Set up realtime subscription for redemptions
    const channel = supabase
      .channel('redemptions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates' 
        }, 
        () => {
          fetchRedemptions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters?.status, filters?.clienteId, filters?.limit]);
  
  return {
    redemptions,
    isLoading,
    error,
    refetch: fetchRedemptions
  };
};
