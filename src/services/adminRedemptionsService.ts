
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

// Add a function to get pending redemptions count for the admin dashboard
export const resgatesPendentes = async () => {
  const redemptions = await fetchRedemptions({ status: 'pendente' });
  return redemptions.filter(r => r.status === 'pendente');
};

// For backward compatibility with the dashboard
export const fetchAdminRedemptionsCount = async () => {
  const pendingRedemptions = await resgatesPendentes();
  return { 
    pending: pendingRedemptions.length,
    total: 0 // This would need to be implemented if required
  };
};
