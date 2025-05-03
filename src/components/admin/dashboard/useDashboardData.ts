
import { useState, useEffect } from 'react';
import { fetchPendingProducts } from '@/services/admin/products';
import { fetchAdminRedemptionsCount } from '@/services/adminRedemptionsService';
import { fetchPendingStores } from '@/services/adminStoresService';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);
  const [pendingStores, setPendingStores] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get pending products
        const products = await fetchPendingProducts();
        setPendingProducts(products.length);
        
        // Get pending redemptions
        const redemptionsCount = await fetchAdminRedemptionsCount();
        setPendingRedemptions(redemptionsCount.pending || 0);
        
        // Get pending stores
        const pendingStoresData = await fetchPendingStores();
        setPendingStores(pendingStoresData.length);
        
        // Recent activity
        setRecentActivity([]); // To be implemented
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  return {
    loading,
    pendingProducts,
    pendingRedemptions,
    pendingStores,
    recentActivity,
    error
  };
};
