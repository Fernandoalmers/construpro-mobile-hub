
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
      refreshProfile();
    }
  }, [user, refreshProfile]);
  
  // Fetch transactions from Supabase with security filtering
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: async () => {
      if (!user) {
        console.warn("🚫 [usePointsHistory] User not authenticated");
        return [];
      }
      
      console.log(`🔍 [usePointsHistory] Fetching points history for user: ${user.id}`);
      
      // RLS irá automaticamente filtrar apenas as transações do usuário logado
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id) // Filtro explícito adicional por segurança
        .order('data', { ascending: false });
      
      if (error) {
        console.error('❌ [usePointsHistory] Error fetching points history:', error);
        return [];
      }
      
      console.log(`✅ [usePointsHistory] Retrieved ${data?.length || 0} transactions for user`);
      return data as Transaction[];
    },
    enabled: !!user // Only fetch if authenticated
  });
  
  // Calculate monthly points and level info
  const monthlyPoints = calculateMonthlyPoints(transactions);
  const levelInfo = calculateLevelInfo(monthlyPoints);
  const currentMonth = getCurrentMonthName();
  
  // Apply filters
  const getFilteredTransactions = () => {
    let filteredTransactions = [...transactions];
    
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

  return {
    transactions: getFilteredTransactions(),
    isLoading,
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
