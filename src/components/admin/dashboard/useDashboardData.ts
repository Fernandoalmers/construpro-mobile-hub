
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminStats } from '@/types/admin';
import { fetchPendingStores } from '@/services/adminStoresService';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);
  const [pendingStores, setPendingStores] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStores, setTotalStores] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get total and pending products
        const { data: productsData, error: productsError } = await supabase
          .from('produtos')
          .select('id, status', { count: 'exact' });
        
        if (productsError) throw productsError;
        
        const pendingProductsCount = (productsData || []).filter(p => p.status === 'pendente').length;
        setPendingProducts(pendingProductsCount);
        setTotalProducts(productsData?.length || 0);
        
        // Get pending redemptions
        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from('resgates')
          .select('*')
          .eq('status', 'pendente');
        
        if (redemptionsError) throw redemptionsError;
        setPendingRedemptions(redemptionsData?.length || 0);
        
        // Get total redemptions
        const { count: totalRedemptionsCount, error: totalRedemptionsError } = await supabase
          .from('resgates')
          .select('*', { count: 'exact', head: true });
          
        if (totalRedemptionsError) throw totalRedemptionsError;
        setTotalRedemptions(totalRedemptionsCount || 0);
        
        // Get pending stores
        const pendingStoresData = await fetchPendingStores();
        setPendingStores(pendingStoresData.length);
        
        // Get total stores
        const { count: storesCount, error: storesError } = await supabase
          .from('vendedores')
          .select('*', { count: 'exact', head: true });
          
        if (storesError) throw storesError;
        setTotalStores(storesCount || 0);
        
        // Get total users
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (usersError) throw usersError;
        setTotalUsers(usersCount || 0);
        
        // Get total categories
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('product_categories')
          .select('*', { count: 'exact', head: true });
          
        if (categoriesError) throw categoriesError;
        setTotalCategories(categoriesCount || 0);
        
        // Get recent activity logs - Fixing the relation issue
        const { data: logsData, error: logsError } = await supabase
          .from('admin_logs')
          .select(`
            id,
            action,
            entity_type,
            entity_id,
            details,
            created_at,
            admin_id
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (logsError) throw logsError;
        
        // Format activity logs and get admin names separately
        const formattedLogs = await Promise.all((logsData || []).map(async (log) => {
          // Get admin name separately
          const { data: adminData } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', log.admin_id)
            .single();
            
          return {
            id: log.id,
            action: log.action,
            entity: `${log.entity_type}: ${log.entity_id}`,
            details: log.details,
            timestamp: log.created_at,
            admin_name: adminData?.nome || 'Admin'
          };
        }));
        
        setRecentActivity(formattedLogs);
        setActivitiesLoading(false);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Erro ao carregar dados do dashboard');
        toast.error('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Create a stats object to match what the components expect
  const stats: AdminStats = {
    products: {
      total: totalProducts,
      pending: pendingProducts
    },
    stores: {
      total: totalStores,
      pending: pendingStores
    },
    redemptions: {
      total: totalRedemptions,
      pending: pendingRedemptions
    },
    users: {
      total: totalUsers,
      pending: 0
    }
  };

  return {
    loading,
    isLoading: loading,
    pendingProducts,
    pendingRedemptions,
    pendingStores,
    totalProducts,
    totalStores,
    totalUsers,
    totalCategories,
    recentActivity,
    error,
    activitiesLoading,
    stats
  };
};
