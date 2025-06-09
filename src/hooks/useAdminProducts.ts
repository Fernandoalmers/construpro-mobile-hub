
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts } from '@/services/admin/products';
import { AdminProduct } from '@/types/admin';

export const useAdminProducts = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const queryClient = useQueryClient();

  // Optimized query with better caching
  const { 
    data: allProducts = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getAdminProducts(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Memoized filtered products for better performance
  const products = useMemo(() => {
    let filtered: AdminProduct[] = allProducts || [];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(product => product.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.nome?.toLowerCase().includes(search) ||
        product.categoria?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allProducts, filter, searchTerm]);

  // Optimized refresh function
  const refreshProducts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    return refetch();
  }, [queryClient, refetch]);

  return {
    products,
    loading,
    error,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    refreshProducts
  };
};
