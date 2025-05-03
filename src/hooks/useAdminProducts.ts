
import { useState, useEffect } from 'react';
import { fetchAdminProducts, approveProduct, rejectProduct, subscribeToAdminProductUpdates } from '@/services/adminProductsService';
import { AdminProduct } from '@/types/admin';
import { toast } from '@/components/ui/sonner';

export const useAdminProducts = (initialFilter: string = 'all') => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await fetchAdminProducts();
      setProducts(productsData);
      applyFilters(productsData, filter, searchTerm);
    } catch (error) {
      console.error('Error loading products:', error);
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
    
    setFilteredProducts(filtered);
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const success = await approveProduct(productId);
      if (success) {
        // Update local state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, status: 'aprovado' } 
              : product
          )
        );
        
        // Re-apply filters
        applyFilters(
          products.map(product => 
            product.id === productId 
              ? { ...product, status: 'aprovado' } 
              : product
          ),
          filter,
          searchTerm
        );
      }
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Erro ao aprovar produto');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      const success = await rejectProduct(productId);
      if (success) {
        // Update local state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, status: 'inativo' } 
              : product
          )
        );
        
        // Re-apply filters
        applyFilters(
          products.map(product => 
            product.id === productId 
              ? { ...product, status: 'inativo' } 
              : product
          ),
          filter,
          searchTerm
        );
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Erro ao rejeitar produto');
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
    
    // Set up realtime subscription for products
    const channel = subscribeToAdminProductUpdates((_, eventType) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
        // Reload products when changes occur
        loadProducts();
      }
    });
      
    return () => {
      supabase.removeChannel(channel);
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
    handleApproveProduct,
    handleRejectProduct,
    refreshProducts: loadProducts
  };
};

import { supabase } from '@/integrations/supabase/client';
