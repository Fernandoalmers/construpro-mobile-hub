
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { fetchAdminLogs } from '@/services/adminService';
import { AdminStats } from '@/types/admin';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  details?: string;
}

interface DashboardData {
  stats: AdminStats;
  isLoading: boolean;
  error: string | null;
  recentActivity: ActivityLog[];
  activitiesLoading: boolean;
}

export const useDashboardData = (): DashboardData => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, pending: 0 },
    products: { total: 0, pending: 0 },
    stores: { total: 0, pending: 0 },
    redemptions: { total: 0, pending: 0 }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    const fetchStats = async () => {
      try {
        // Fetch total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (usersError) throw new Error('Error fetching users: ' + usersError.message);
        
        // Fetch pending users count
        const { count: pendingUsers, error: pendingUsersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingUsersError) throw new Error('Error fetching pending users: ' + pendingUsersError.message);
        
        // Fetch total products count - use produtos table, not products
        const { count: totalProducts, error: productsError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true });
          
        if (productsError) throw new Error('Error fetching products: ' + productsError.message);
        
        // Fetch pending products count
        const { count: pendingProducts, error: pendingProductsError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingProductsError) throw new Error('Error fetching pending products: ' + pendingProductsError.message);
        
        // Fetch total stores count - use lojas table, not stores
        const { count: totalStores, error: storesError } = await supabase
          .from('lojas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativa'); // Only count active stores
          
        if (storesError) throw new Error('Error fetching stores: ' + storesError.message);
        
        // Fetch pending stores count
        const { count: pendingStores, error: pendingStoresError } = await supabase
          .from('lojas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingStoresError) throw new Error('Error fetching pending stores: ' + pendingStoresError.message);
        
        // Fetch total redemptions count
        const { count: totalRedemptions, error: redemptionsError } = await supabase
          .from('resgates')
          .select('*', { count: 'exact', head: true });
          
        if (redemptionsError) throw new Error('Error fetching redemptions: ' + redemptionsError.message);
        
        // Fetch pending redemptions count
        const { count: pendingRedemptions, error: pendingRedemptionsError } = await supabase
          .from('resgates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingRedemptionsError) throw new Error('Error fetching pending redemptions: ' + pendingRedemptionsError.message);

        // Update stats with real data
        setStats({
          users: { 
            total: totalUsers || 0, 
            pending: pendingUsers || 0 
          },
          products: { 
            total: totalProducts || 0, 
            pending: pendingProducts || 0 
          },
          stores: { 
            total: totalStores || 0, 
            pending: pendingStores || 0 
          },
          redemptions: { 
            total: totalRedemptions || 0, 
            pending: pendingRedemptions || 0 
          }
        });
        
        setIsLoading(false);
        setError(null);
        
        // Fetch recent admin logs
        await fetchRecentActivity();
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar estatísticas');
        setIsLoading(false);
        toast.error('Erro ao carregar estatísticas do painel');
      }
    };
    
    const fetchRecentActivity = async () => {
      try {
        setActivitiesLoading(true);
        
        // Use fetchAdminLogs from adminService.ts
        const logs = await fetchAdminLogs(5);
        
        if (logs && logs.length > 0) {
          // Format admin logs appropriately
          const formattedLogs = logs.map(log => ({
            id: log.id,
            action: log.action,
            entity: log.entity_type + ': ' + log.entity_id,
            timestamp: new Date(log.created_at).toISOString(),
            details: log.details ? JSON.stringify(log.details) : undefined
          }));
          
          setRecentActivity(formattedLogs);
        } else {
          // If no logs exist, set empty array - don't create fictional data
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Erro ao carregar histórico de atividades');
        // Set empty array on error
        setRecentActivity([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isAdminLoading]);

  return {
    stats,
    isLoading,
    error,
    recentActivity,
    activitiesLoading
  };
};
