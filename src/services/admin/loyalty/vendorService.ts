
import { toast } from '@/components/ui/sonner';
import { VendorAdjustment, VendorAdjustmentSummary } from './types';
import { 
  fetchVendorAdjustments, 
  fetchVendorsForAdjustments, 
  fetchUsersForAdjustments 
} from './vendor/vendorAdjustmentsFetcher';
import { processVendorAdjustments } from './vendor/vendorDataProcessor';
import { getVendorAdjustmentsSummary } from './vendor/vendorSummaryService';

export const vendorService = {
  async getVendorAdjustments(limit?: number): Promise<VendorAdjustment[]> {
    try {
      // Step 1: Get ALL adjustments without any limit
      const allAdjustments = await fetchVendorAdjustments(limit);
      
      if (!allAdjustments || allAdjustments.length === 0) {
        return [];
      }

      // Get unique vendor IDs from adjustments
      const vendorIdsInAdjustments = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
      
      // Step 2: Get ALL vendors
      const allVendors = await fetchVendorsForAdjustments(vendorIdsInAdjustments);
      
      if (!allVendors || allVendors.length === 0) {
        console.log('⚠️ [vendorService] No vendors found with the specified IDs');
        return [];
      }

      // Step 3: Get user data
      const userIds = [...new Set(allAdjustments.map(a => a.usuario_id))];
      const usersData = await fetchUsersForAdjustments(userIds);

      // Step 4: Process and return results
      return processVendorAdjustments(allAdjustments, allVendors, usersData, limit);
      
    } catch (error) {
      console.error('❌ [vendorService] Error fetching vendor adjustments:', error);
      toast.error('Erro ao buscar ajustes de vendedores');
      return [];
    }
  },

  async getVendorAdjustmentsSummary(): Promise<VendorAdjustmentSummary[]> {
    return getVendorAdjustmentsSummary();
  }
};
