
import { QueryClient } from '@tanstack/react-query';
import { getAdminProducts } from '@/services/admin/products';
import { fetchProductCategories } from '@/services/admin/categories';
import { getProductSegments } from '@/services/admin/productSegmentsService';

// Prefetch critical data for better performance
export const prefetchAdminData = async (queryClient: QueryClient) => {
  try {
    // Prefetch admin products
    await queryClient.prefetchQuery({
      queryKey: ['admin-products'],
      queryFn: () => getAdminProducts(),
      staleTime: 2 * 60 * 1000,
    });

    // Prefetch categories
    await queryClient.prefetchQuery({
      queryKey: ['product-categories'],
      queryFn: fetchProductCategories,
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch segments
    await queryClient.prefetchQuery({
      queryKey: ['product-segments'],
      queryFn: getProductSegments,
      staleTime: 5 * 60 * 1000,
    });

    console.log('✅ Admin data prefetched successfully');
  } catch (error) {
    console.warn('⚠️ Failed to prefetch admin data:', error);
  }
};

export const prefetchUserData = async (queryClient: QueryClient, userId: string) => {
  try {
    // Add user-specific prefetching here when needed
    console.log('✅ User data prefetched for:', userId);
  } catch (error) {
    console.warn('⚠️ Failed to prefetch user data:', error);
  }
};
