
// Re-export types
export * from './types';

// Re-export services
export { statsService } from './statsService';
export { userService } from './userService';
export { transactionsService } from './transactionsService';
export { vendorService } from './vendorService';
export { realtimeService } from './realtimeService';

// Main loyaltyService that combines all functionality for backward compatibility
export const loyaltyService = {
  // Stats
  getLoyaltyStats: async () => {
    const { statsService } = await import('./statsService');
    return statsService.getLoyaltyStats();
  },

  // Users
  getUserRanking: async (limit = 10) => {
    const { userService } = await import('./userService');
    return userService.getUserRanking(limit);
  },

  // Transactions
  getRecentTransactions: async (limit = 20) => {
    const { transactionsService } = await import('./transactionsService');
    return transactionsService.getRecentTransactions(limit);
  },

  // Vendor adjustments
  getVendorAdjustments: async (limit = 20) => {
    const { vendorService } = await import('./vendorService');
    return vendorService.getVendorAdjustments(limit);
  },

  getVendorAdjustmentsSummary: async () => {
    const { vendorService } = await import('./vendorService');
    return vendorService.getVendorAdjustmentsSummary();
  },

  // Realtime
  subscribeToLoyaltyUpdates: (
    onStatsUpdate: () => void,
    onTransactionsUpdate: () => void,
    onAdjustmentsUpdate: () => void
  ) => {
    const { realtimeService } = require('./realtimeService');
    return realtimeService.subscribeToLoyaltyUpdates(
      onStatsUpdate,
      onTransactionsUpdate,
      onAdjustmentsUpdate
    );
  }
};
