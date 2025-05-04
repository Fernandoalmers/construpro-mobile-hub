
import { useMemo } from 'react';
import { Product } from '@/services/productService';

interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
}

export function useDeliveryEstimate(product: Product | null): DeliveryEstimate {
  return useMemo(() => {
    // Default values
    const defaultEstimate = {
      minDays: 1,
      maxDays: 5
    };
    
    if (!product || !product.stores) {
      return defaultEstimate;
    }
    
    // Extract the vendor data from the stores object
    const vendorData = product.stores;
    
    if (!vendorData || typeof vendorData !== 'object') {
      return defaultEstimate;
    }
    
    // Try to access the formas_entrega from the product data structure
    // This requires traversing back to the original data which might not be available
    // In a real app, you might want to include this data in the Product interface directly
    try {
      // Since we don't have direct access to formas_entrega here, we use the default
      return defaultEstimate;
    } catch (error) {
      console.error('Error calculating delivery estimate:', error);
      return defaultEstimate;
    }
  }, [product]);
}
