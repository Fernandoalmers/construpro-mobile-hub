
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
  estoque?: number | null;
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
      
      // Get current user for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user fetching rewards:', user?.id);
      
      // Get rewards from Supabase - only filter for active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('resgates')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
        throw rewardsError;
      }
      
      console.log('Fetched user-facing rewards data:', rewardsData); // Debug log
      
      // Transform data from database format to our app format
      const transformedRewards: Reward[] = (rewardsData || []).map(item => ({
        id: item.id,
        titulo: item.item || 'Recompensa',
        pontos: item.pontos,
        categoria: item.categoria || 'Geral',
        imagemUrl: item.imagem_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        descricao: item.descricao || 'Vale-compra para utilizar em qualquer loja parceira do ConstruPro+.',
        estoque: item.estoque,
        prazoEntrega: '7-10 dias úteis',
        status: item.status
      }));
      
      console.log('Transformed rewards for display:', transformedRewards); // Debug log

      setRewards(transformedRewards);
      
      // Extract unique categories from rewards
      const uniqueCategories = Array.from(new Set(transformedRewards.map(r => r.categoria)));
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      } else {
        // Set predefined categories if none exist
        setCategories(['Geral', 'Vale-compra', 'Eletrônicos', 'Casa']);
      }
      
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
        (payload) => {
          console.log('Realtime reward update received:', payload);
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
      reward.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
      (reward.descricao && reward.descricao.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Filter by categories
    const matchesCategory = !filters?.categories?.length || 
      filters.categories.includes(reward.categoria);
    
    // We'll still show all rewards even if they're more than the available points
    // The UI will show progress bars and different states based on this
    
    return matchesSearch && matchesCategory;
  });

  return {
    rewards: filteredRewards,
    categories,
    isLoading,
    error,
    refetch: fetchRewards
  };
};
