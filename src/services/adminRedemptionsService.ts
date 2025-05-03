
// This file is kept for backward compatibility
// It re-exports everything from the new modular structure

import { 
  AdminRedemption,
  fetchRedemptions,
  approveRedemption,
  rejectRedemption,
  markRedemptionAsDelivered,
  getRedemptionStatusBadgeColor
} from './admin/redemptions';

export {
  AdminRedemption,
  fetchRedemptions,
  approveRedemption,
  rejectRedemption,
  markRedemptionAsDelivered,
  getRedemptionStatusBadgeColor
};
