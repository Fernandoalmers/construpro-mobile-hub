
// Re-export types
export * from './types';

// Re-export services
export { statsService } from './statsService';
export { userService } from './userService';
export { transactionsService } from './transactionsService';
export { vendorService } from './vendorService';
export { realtimeService } from './realtimeService';

// Import services statically
import { statsService } from './statsService';
import { userService } from './userService';
import { transactionsService } from './transactionsService';
import { vendorService } from './vendorService';
import { realtimeService } from './realtimeService';

// Main loyaltyService that combines all functionality for backward compatibility
export const loyaltyService = {
  // Stats
  getLoyaltyStats: () => {
    return statsService.getLoyaltyStats();
  },

  // Users
  getUserRanking: (limit = 10) => {
    return userService.getUserRanking(limit);
  },

  // Transactions
  getRecentTransactions: (limit = 20) => {
    return transactionsService.getRecentTransactions(limit);
  },

  // Vendor adjustments - removed limit parameter since vendorService.getVendorAdjustments() no longer accepts it
  getVendorAdjustments: () => {
    return vendorService.getVendorAdjustments();
  },

  getVendorAdjustmentsSummary: () => {
    return vendorService.getVendorAdjustmentsSummary();
  },

  // Realtime
  subscribeToLoyaltyUpdates: (
    onStatsUpdate: () => void,
    onTransactionsUpdate: () => void,
    onAdjustmentsUpdate: () => void
  ) => {
    return realtimeService.subscribeToLoyaltyUpdates(
      onStatsUpdate,
      onTransactionsUpdate,
      onAdjustmentsUpdate
    );
  }
};
