
// This file is kept for backward compatibility
// It re-exports everything from the new modular structure

import { 
  fetchRedemptions,
  approveRedemption,
  rejectRedemption,
  markRedemptionAsDelivered,
  getRedemptionStatusBadgeColor,
  getRedemptionsCount
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

// Add a function to get pending redemptions count for the admin dashboard
export const resgatesPendentes = async () => {
  return await fetchRedemptions(false);
};

// For backward compatibility with the dashboard
export const fetchAdminRedemptionsCount = async () => {
  return await getRedemptionsCount();
};
