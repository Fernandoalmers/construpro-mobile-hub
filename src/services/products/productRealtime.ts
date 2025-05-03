
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { VendorProduct } from './productBase';

/**
 * Channel storage to properly manage subscriptions
 */
const activeChannels: Record<string, RealtimeChannel> = {};

/**
 * Subscribe to changes on a vendor's products
 * @param vendorId - The vendor's ID
 * @param callback - The callback function to execute when changes occur
 * @returns The subscription channel
 */
export const subscribeToVendorProducts = (
  vendorId: string, 
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  // Unsubscribe from any existing channel with the same name to prevent duplicates
  if (activeChannels[`vendor-products-${vendorId}`]) {
    activeChannels[`vendor-products-${vendorId}`].unsubscribe();
  }
  
  const channel = supabase
    .channel(`vendor-products-${vendorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos',
        filter: `vendedor_id=eq.${vendorId}`
      },
      (payload) => {
        console.log('Produto atualizado:', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new as VendorProduct;
        callback(product, eventType);
      }
    )
    .subscribe();
    
  // Store the channel reference
  activeChannels[`vendor-products-${vendorId}`] = channel;
  
  return channel;
};

/**
 * Subscribe to changes on all products (admin use)
 * @param callback - The callback function to execute when changes occur
 * @returns The subscription channel
 */
export const subscribeToAllProducts = (
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  // Unsubscribe from any existing channel with the same name to prevent duplicates
  if (activeChannels['all-products']) {
    activeChannels['all-products'].unsubscribe();
  }
  
  const channel = supabase
    .channel('all-products')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos'
      },
      (payload) => {
        console.log('Produto atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new as VendorProduct;
        callback(product, eventType);
      }
    )
    .subscribe();
    
  // Store the channel reference
  activeChannels['all-products'] = channel;
  
  return channel;
};

/**
 * Subscribe to admin product updates (for specific admin actions)
 * @param callback - The callback function to execute when changes occur
 * @returns The subscription channel
 */
export const subscribeToAdminProductUpdates = (
  callback: (product: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  // Unsubscribe from any existing channel with the same name to prevent duplicates
  if (activeChannels['admin-products']) {
    activeChannels['admin-products'].unsubscribe();
  }
  
  const channel = supabase
    .channel('admin-products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos'
      },
      (payload) => {
        console.log('Produto atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new;
        callback(product, eventType);
      }
    )
    .subscribe();
    
  // Store the channel reference
  activeChannels['admin-products'] = channel;
  
  return channel;
};

/**
 * Unsubscribe from a specific channel
 * @param channelName - Name of the channel to unsubscribe from
 */
export const unsubscribeFromChannel = (channelName: string): void => {
  if (activeChannels[channelName]) {
    activeChannels[channelName].unsubscribe();
    delete activeChannels[channelName];
  }
};

/**
 * Unsubscribe from all active channels
 */
export const unsubscribeAll = (): void => {
  Object.values(activeChannels).forEach(channel => {
    channel.unsubscribe();
  });
  
  // Clear the channels object
  Object.keys(activeChannels).forEach(key => {
    delete activeChannels[key];
  });
};
