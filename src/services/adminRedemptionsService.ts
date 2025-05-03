
// This file is kept for backward compatibility
// It re-exports everything from the new modular structure

import { 
  fetchRedemptions,
  approveRedemption,
  rejectRedemption,
  markRedemptionAsDelivered,
  getRedemptionStatusBadgeColor
} from './admin/redemptions';

// Use "export type" for type re-exports when isolatedModules is enabled
export type { AdminRedemption } from './admin/redemptions';

// Export functions and other non-type exports
export {
  fetchRedemptions,
  approveRedemption,
  rejectRedemption,
  markRedemptionAsDelivered,
  getRedemptionStatusBadgeColor
};
