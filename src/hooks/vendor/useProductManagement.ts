
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getVendorProducts, 
  updateProductStatus, 
  deleteVendorProduct, 
  VendorProduct,
  subscribeToVendorProducts,
  getVendorProfile
} from '@/services/vendorService';
import { toast } from '@/components/ui/sonner';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';

export const useProductManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  
  // Fetch products with improved error handling and logging
  const { 
    data: products = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['vendorProducts'],
    queryFn: async () => {
      console.log('[ProductManagement] Fetching vendor products');
      try {
        const products = await getVendorProducts();
        console.log(`[ProductManagement] Fetched ${products.length} products:`, products);
        return products;
      } catch (err) {
        console.error('[ProductManagement] Error fetching products:', err);
        throw err;
      }
    },
  });
  
  // Configure realtime subscription for products
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Get vendor ID
        const vendorProfile = await getVendorProfile();
        if (!vendorProfile) {
          console.error('Vendor profile not found');
          return;
        }
        
        console.log('[ProductManagement] Setting up realtime subscription for vendor:', vendorProfile.id);
        
        // Cancel previous subscription if it exists
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }
        
        // Set up new subscription
        const channel = subscribeToVendorProducts(vendorProfile.id, (product, eventType) => {
          console.log('[ProductManagement] Realtime event:', eventType, product);
          
          // Invalidate products query to update UI
          queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
          
          // Show relevant notifications
          if (eventType === 'INSERT') {
            toast.success('New product added');
          } else if (eventType === 'UPDATE') {
            toast.success(`Product "${product.nome}" updated`);
          } else if (eventType === 'DELETE') {
            toast.info('Product removed');
          }
        });
        
        setRealtimeChannel(channel);
        
        // Clean up subscription when component unmounts
        return () => {
          if (channel) {
            channel.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };
    
    setupRealtimeSubscription();
  }, [queryClient]);
  
  // Toggle product status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo' }) => {
      return await updateProductStatus(productId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      toast.success('Product status updated successfully');
    },
    onError: (error) => {
      toast.error('Error updating product status');
      console.error('Error toggling product status:', error);
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => {
      return deleteVendorProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Error deleting product');
      console.error('Error deleting product:', error);
    }
  });

  // Filter products based on search and status
  const filteredProducts = products.filter(produto => {
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || produto.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (productId: string, currentStatus: string) => {
    // Logic to determine the next status
    let newStatus: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
    
    if (currentStatus === 'ativo' || currentStatus === 'aprovado') {
      newStatus = 'inativo';
    } else {
      newStatus = 'pendente';
    }
    
    toggleStatusMutation.mutate({ productId, newStatus });
  };
  
  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus(null);
  };
  
  return {
    products,
    filteredProducts,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    handleToggleStatus,
    handleDelete,
    handleClearFilters,
    refetch
  };
};
