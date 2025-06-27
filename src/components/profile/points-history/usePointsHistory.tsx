
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  calculateMonthlyPoints, 
  calculateLevelInfo, 
  getCurrentMonthName,
  Transaction 
} from '@/utils/pointsCalculations';

export const usePointsHistory = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [originFilter, setOriginFilter] = useState<string>("todos");
  const [periodFilter, setPeriodFilter] = useState<string>("todos");
  const [showFilters, setShowFilters] = useState(false);
  
  // Call refreshProfile when component mounts to ensure we have the latest data
  useEffect(() => {
    if (user) {
      console.log('🔄 [usePointsHistory] Refreshing profile for user:', user.id);
      refreshProfile();
    }
  }, [user, refreshProfile]);
  
  // Fetch transactions from Supabase with security filtering
  const { data: transactions = [], isLoading, refetch, error } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: async () => {
      if (!user) {
        console.warn("🚫 [usePointsHistory] User not authenticated");
        return [];
      }
      
      console.log(`🔍 [usePointsHistory] Fetching points history for user: ${user.id}`);
      
      try {
        // RLS irá automaticamente filtrar apenas as transações do usuário logado
        const { data, error } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', user.id) // Filtro explícito adicional por segurança
          .order('data', { ascending: false });
        
        if (error) {
          console.error('❌ [usePointsHistory] Error fetching points history:', error);
          throw error;
        }
        
        console.log(`✅ [usePointsHistory] Retrieved ${data?.length || 0} transactions for user`);
        
        if (!data || data.length === 0) {
          console.log('⚠️ [usePointsHistory] No transactions found, creating sample data might be needed');
        }
        
        return data as Transaction[];
      } catch (error) {
        console.error('❌ [usePointsHistory] Exception in queryFn:', error);
        throw error;
      }
    },
    enabled: !!user, // Only fetch if authenticated
    retry: 2,
    retryDelay: 1000
  });
  
  // Handle query errors using useEffect since onError is deprecated
  useEffect(() => {
    if (error) {
      console.error('❌ [usePointsHistory] Query error detected:', error);
      toast.error('Erro ao carregar histórico de pontos');
    }
  }, [error]);
  
  // Calculate monthly points and level info
  const monthlyPoints = calculateMonthlyPoints(transactions);
  const levelInfo = calculateLevelInfo(monthlyPoints);
  const currentMonth = getCurrentMonthName();
  
  console.log(`📊 [usePointsHistory] Calculated stats - Monthly: ${monthlyPoints}, Level: ${levelInfo.currentLevel}`);
  
  // Apply filters
  const getFilteredTransactions = () => {
    let filteredTransactions = [...transactions];
    
    console.log(`🔍 [usePointsHistory] Applying filters - Type: ${typeFilter}, Origin: ${originFilter}, Period: ${periodFilter}`);
    
    // Apply type filter (ganho/resgate)
    if (typeFilter === "ganho") {
      filteredTransactions = filteredTransactions.filter(t => t.pontos > 0);
    } else if (typeFilter === "resgate") {
      filteredTransactions = filteredTransactions.filter(t => t.pontos < 0);
    }
    
    // Apply origin filter
    if (originFilter !== "todos") {
      filteredTransactions = filteredTransactions.filter(t => t.tipo === originFilter);
    }
    
    // Apply period filter
    if (periodFilter !== "todos") {
      const now = new Date();
      let startDate: Date;
      
      switch (periodFilter) {
        case "30dias":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case "90dias":
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        case "6meses":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.data) >= startDate
      );
    }
    
    console.log(`✅ [usePointsHistory] Filtered transactions: ${filteredTransactions.length} of ${transactions.length}`);
    return filteredTransactions;
  };

  // Calculate total points from profile (with security validation)
  const totalPoints = profile?.saldo_pontos || 0;
  
  // Calculate points statistics
  const totalEarned = transactions
    .filter(t => t.pontos > 0)
    .reduce((sum, t) => sum + t.pontos, 0);
    
  const totalRedeemed = transactions
    .filter(t => t.pontos < 0)
    .reduce((sum, t) => sum + Math.abs(t.pontos), 0);

  console.log(`📊 [usePointsHistory] Stats - Total: ${totalPoints}, Earned: ${totalEarned}, Redeemed: ${totalRedeemed}`);

  return {
    transactions: getFilteredTransactions(),
    isLoading,
    error,
    refetch,
    levelInfo,
    currentMonth,
    totalPoints,
    totalEarned,
    totalRedeemed,
    filters: {
      typeFilter,
      setTypeFilter,
      originFilter,
      setOriginFilter,
      periodFilter,
      setPeriodFilter,
      showFilters,
      setShowFilters
    },
    refreshProfile
  };
};
