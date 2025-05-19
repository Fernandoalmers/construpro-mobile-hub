
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface Reward {
  id: string;
  titulo: string;
  pontos: number;
  categoria: string;
  imagemUrl: string;
  descricao?: string;
  estoque?: number;
  prazoEntrega?: string;
  status: string;
}

export const useRewardsData = (filters?: { 
  search?: string;
  categories?: string[];
  userPointsAvailable?: number;
}) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get rewards from Supabase
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('resgates')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (rewardsError) {
        throw rewardsError;
      }
      
      // Transform data from database format to our app format
      const transformedRewards: Reward[] = (rewardsData || []).map(item => ({
        id: item.id,
        titulo: item.item,
        pontos: item.pontos,
        categoria: item.categoria || 'Geral',
        imagemUrl: item.imagem_url || 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        descricao: item.descricao,
        estoque: item.estoque,
        prazoEntrega: item.prazo_entrega || '7-10 dias úteis',
        status: item.status
      }));

      setRewards(transformedRewards);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(transformedRewards.map(reward => reward.categoria))
      );
      setCategories(uniqueCategories);
      
    } catch (err: any) {
      console.error('Error fetching rewards:', err);
      setError(err.message || 'Erro ao carregar recompensas');
      toast.error('Falha ao carregar recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    
    // Set up realtime subscription for rewards
    const channel = supabase
      .channel('rewards_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates' 
        }, 
        () => {
          fetchRewards();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Filter rewards based on search and categories
  const filteredRewards = rewards.filter(reward => {
    // Filter by search term
    const matchesSearch = !filters?.search || 
      reward.titulo.toLowerCase().includes(filters.search.toLowerCase());
    
    // Filter by categories
    const matchesCategory = !filters?.categories?.length || 
      filters.categories.includes(reward.categoria);
    
    // Filter by points available (only show rewards the user can afford)
    const isAffordable = filters?.userPointsAvailable === undefined || 
      reward.pontos <= filters.userPointsAvailable;
    
    return matchesSearch && matchesCategory && isAffordable;
  });

  return {
    rewards: filteredRewards,
    categories,
    isLoading,
    error,
    refetch: fetchRewards
  };
};
