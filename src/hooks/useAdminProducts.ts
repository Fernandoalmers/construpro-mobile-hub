
import { useState, useEffect } from 'react';
import { 
  fetchAdminProducts, 
  subscribeToAdminProductUpdates, 
  unsubscribeFromChannel 
} from '@/services/admin/products';
import { AdminProduct } from '@/types/admin';
import { toast } from '@/components/ui/sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useAdminProducts = (initialFilter: string = 'all') => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('[useAdminProducts] Loading admin products...');
      const productsData = await fetchAdminProducts();
      console.log('[useAdminProducts] Admin products loaded:', productsData);
      setProducts(productsData);
      applyFilters(productsData, filter, searchTerm);
    } catch (error) {
      console.error('[useAdminProducts] Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (products: AdminProduct[], statusFilter: string, search: string) => {
    let filtered = [...products];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        product => 
          product.nome.toLowerCase().includes(lowerSearch) ||
          product.descricao.toLowerCase().includes(lowerSearch) ||
          product.categoria.toLowerCase().includes(lowerSearch) ||
          (product.lojaNome && product.lojaNome.toLowerCase().includes(lowerSearch))
      );
    }
    
    console.log('[useAdminProducts] Filtered products:', filtered.length);
    setFilteredProducts(filtered);
  };

  // Initial load and realtime setup
  useEffect(() => {
    loadProducts();
    
    // Set up realtime subscription for products
    const channel = subscribeToAdminProductUpdates((product, eventType) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
        // Reload products when changes occur
        console.log('[useAdminProducts] Realtime product update detected, reloading products...');
        loadProducts();
      }
    });
    
    setRealtimeChannel(channel);
      
    return () => {
      unsubscribeFromChannel(channel);
    };
  }, []);

  // Apply filters when filter or search changes
  useEffect(() => {
    applyFilters(products, filter, searchTerm);
  }, [filter, searchTerm, products]);

  return {
    products: filteredProducts,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    refreshProducts: loadProducts
  };
};
