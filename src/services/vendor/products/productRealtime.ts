
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { VendorProduct } from './types';

// Função para configurar assinatura em tempo real para produtos de um vendedor
export const subscribeToVendorProducts = (
  vendorId: string, 
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  return supabase
    .channel('vendor-products-changes')
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
};

// Função para configurar assinatura em tempo real para todos os produtos (uso administrativo)
export const subscribeToAllProducts = (
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  return supabase
    .channel('all-products-changes')
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
};
