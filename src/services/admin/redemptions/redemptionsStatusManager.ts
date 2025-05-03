
import { supabase } from '@/integrations/supabase/client';
import { updateRedemptionInCache } from './redemptionsFetcher';

/**
 * Approve a redemption
 */
export const approveRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error approving redemption:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'approve_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache with the new status
    updateRedemptionInCache(redemptionId, 'aprovado');

    return true;
  } catch (error) {
    console.error('Unexpected error approving redemption:', error);
    return false;
  }
};

/**
 * Reject a redemption
 */
export const rejectRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'recusado', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error rejecting redemption:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'reject_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache with the new status
    updateRedemptionInCache(redemptionId, 'recusado');

    return true;
  } catch (error) {
    console.error('Unexpected error rejecting redemption:', error);
    return false;
  }
};

/**
 * Mark a redemption as delivered
 */
export const markRedemptionAsDelivered = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'entregue', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error marking redemption as delivered:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'deliver_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache with the new status
    updateRedemptionInCache(redemptionId, 'entregue');

    return true;
  } catch (error) {
    console.error('Unexpected error marking redemption as delivered:', error);
    return false;
  }
};
