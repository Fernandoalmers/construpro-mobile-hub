
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
      console.log(`🔍 [vendorService] === ENHANCED getVendorAdjustments CALL ===`);
      console.log(`🔍 [vendorService] Requested limit: ${limit || 'NO LIMIT'}`);
      
      // Step 1: Get ALL adjustments without any limit initially
      const allAdjustments = await fetchVendorAdjustments();
      
      if (!allAdjustments || allAdjustments.length === 0) {
        console.log('⚠️ [vendorService] No adjustments found');
        return [];
      }

      console.log(`📊 [vendorService] Total adjustments fetched: ${allAdjustments.length}`);

      // Get unique vendor IDs from adjustments
      const vendorIdsInAdjustments = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
      console.log(`🏪 [vendorService] Unique vendors in adjustments: ${vendorIdsInAdjustments.length}`);
      
      // Step 2: Get ALL vendors (no status filter)
      const allVendors = await fetchVendorsForAdjustments(vendorIdsInAdjustments);
      
      if (!allVendors || allVendors.length === 0) {
        console.log('⚠️ [vendorService] No vendors found with the specified IDs');
        return [];
      }

      console.log(`🏪 [vendorService] Vendors found: ${allVendors.length}`);
      console.log(`🏪 [vendorService] Vendor names: ${allVendors.map(v => v.nome_loja).join(', ')}`);

      // Step 3: Get user data
      const userIds = [...new Set(allAdjustments.map(a => a.usuario_id))];
      const usersData = await fetchUsersForAdjustments(userIds);

      // Step 4: Process ALL data first (no limit in processing)
      const processedAdjustments = processVendorAdjustments(allAdjustments, allVendors, usersData);
      
      console.log(`✅ [vendorService] Processed ${processedAdjustments.length} total adjustments`);
      console.log(`🏪 [vendorService] Unique vendors in processed data: ${[...new Set(processedAdjustments.map(adj => adj.vendedor_nome))].join(', ')}`);
      
      // Step 5: Apply limit ONLY for display purposes if specified
      const finalResult = limit ? processedAdjustments.slice(0, limit) : processedAdjustments;
      console.log(`📋 [vendorService] Final result after limit (${limit || 'no limit'}): ${finalResult.length} adjustments`);
      
      // CRITICAL: Check if Mais Real is in the final result
      const maisRealInResult = finalResult.find(adj => adj.vendedor_nome.includes('Mais Real'));
      if (maisRealInResult) {
        console.log(`🎉 [vendorService] SUCCESS! Mais Real found in final result`);
      } else {
        console.log('❌ [vendorService] WARNING: Mais Real NOT found in final result');
        // Check if it was in the processed data before limit
        const maisRealInProcessed = processedAdjustments.find(adj => adj.vendedor_nome.includes('Mais Real'));
        if (maisRealInProcessed) {
          console.log(`⚠️ [vendorService] Mais Real was REMOVED by limit (${limit}). Consider increasing limit or removing it.`);
        }
      }
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ [vendorService] Error fetching vendor adjustments:', error);
      toast.error('Erro ao buscar ajustes de vendedores');
      return [];
    }
  },

  async getVendorAdjustmentsSummary(): Promise<VendorAdjustmentSummary[]> {
    console.log('🔍 [vendorService] === CALLING getVendorAdjustmentsSummary ===');
    return getVendorAdjustmentsSummary();
  }
};
