
import { useState, useEffect } from 'react';
import { fetchPendingProducts } from '@/services/admin/products';
import { resgatesPendentes } from '@/services/adminRedemptionsService';
import { fetchPendingStores } from '@/services/adminStoresService';

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
        const products = await fetchPendingProducts();
        setPendingProducts(products.length);
        
        // Get pending redemptions - using resgatesPendentes instead of fetchAdminRedemptionsCount
        const redemptions = await resgatesPendentes();
        setPendingRedemptions(redemptions.length || 0);
        
        // Get pending stores
        const pendingStoresData = await fetchPendingStores();
        setPendingStores(pendingStoresData.length);
        
        // Recent activity
        setRecentActivity([]); // To be implemented
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
  const stats = {
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
