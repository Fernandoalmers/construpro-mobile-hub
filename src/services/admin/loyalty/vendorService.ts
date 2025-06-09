
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
  async getVendorAdjustments(): Promise<VendorAdjustment[]> {
    try {
      console.log(`🔍 [vendorService] === FIXED getVendorAdjustments CALL ===`);
      console.log(`🔍 [vendorService] NO LIMITS - Processing ALL data for consistency`);
      
      // Step 1: Get ALL adjustments without any limit
      const allAdjustments = await fetchVendorAdjustments();
      
      if (!allAdjustments || allAdjustments.length === 0) {
        console.log('⚠️ [vendorService] No adjustments found');
        return [];
      }

      console.log(`📊 [vendorService] Total adjustments fetched: ${allAdjustments.length}`);

      // Get unique vendor IDs from adjustments
      const vendorIdsInAdjustments = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
      console.log(`🏪 [vendorService] Unique vendors in adjustments: ${vendorIdsInAdjustments.length}`);
      console.log(`🏪 [vendorService] Vendor IDs: ${vendorIdsInAdjustments.join(', ')}`);
      
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

      // Step 4: Process ALL data (no limit in processing)
      const processedAdjustments = processVendorAdjustments(allAdjustments, allVendors, usersData);
      
      console.log(`✅ [vendorService] Processed ${processedAdjustments.length} total adjustments`);
      console.log(`🏪 [vendorService] Unique vendors in processed data: ${[...new Set(processedAdjustments.map(adj => adj.vendedor_nome))].join(', ')}`);
      
      // CRITICAL: Check if both key vendors are in the result
      const maisRealInResult = processedAdjustments.find(adj => adj.vendedor_nome.includes('Mais Real'));
      const beabaInResult = processedAdjustments.find(adj => adj.vendedor_nome.includes('Beaba'));
      
      if (maisRealInResult && beabaInResult) {
        console.log(`🎉 [vendorService] SUCCESS! Both vendors found in result`);
      } else {
        console.log('❌ [vendorService] WARNING: Missing vendors in result');
        console.log(`  - Mais Real found: ${!!maisRealInResult}`);
        console.log(`  - Beaba found: ${!!beabaInResult}`);
      }
      
      return processedAdjustments;
      
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
