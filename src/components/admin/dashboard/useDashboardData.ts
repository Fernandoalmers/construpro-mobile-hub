
import { useState, useEffect } from 'react';
import { getPendingProducts } from '@/services/admin/products/adminProductApi';
import { fetchRedemptions } from '@/services/admin/redemptions/redemptionsFetcher';
import { getAdminPendingStores } from '@/services/admin/stores';
import { AdminStats } from '@/types/admin';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);
  const [pendingStores, setPendingStores] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get pending products
        const products = await getPendingProducts();
        setPendingProducts(products.length);
        
        // Get pending redemptions - using proper function now
        const redemptions = await fetchRedemptions(false);
        setPendingRedemptions(redemptions.length);
        
        // Get pending stores
        const pendingStoresData = await getAdminPendingStores();
        setPendingStores(pendingStoresData.length);
        
        // Recent activity - to be implemented
        setRecentActivity([]);
        setActivitiesLoading(false);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Create a stats object to match what the components expect
  const stats: AdminStats = {
    products: {
      total: 0, // This would come from an API call
      pending: pendingProducts
    },
    stores: {
      total: 0, // This would come from an API call
      pending: pendingStores
    },
    redemptions: {
      total: 0, // This would come from an API call
      pending: pendingRedemptions
    },
    users: {
      total: 0, // This would come from an API call
      pending: 0
    }
  };

  return {
    loading,
    isLoading: loading,
    pendingProducts,
    pendingRedemptions,
    pendingStores,
    recentActivity,
    error,
    activitiesLoading,
    stats
  };
};
