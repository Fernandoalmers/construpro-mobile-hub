
import { supabase } from '@/integrations/supabase/client';

export interface VendorDeliveryZone {
  id: string;
  vendor_id: string;
  zone_name: string;
  zone_type: 'cep_range' | 'cep_specific' | 'ibge' | 'cidade';
  zone_value: string;
  delivery_time: string;
  delivery_fee: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorProductRestriction {
  id: string;
  vendor_id: string;
  product_id: string;
  delivery_zone_id?: string;
  zone_type: 'cep_range' | 'cep_specific' | 'ibge' | 'cidade';
  zone_value: string;
  restriction_type: 'not_delivered' | 'freight_on_demand' | 'higher_fee';
  restriction_message: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRestrictionCheck {
  has_restriction: boolean;
  restriction_type: string;
  restriction_message: string;
  delivery_available: boolean;
}

// Vendor Delivery Zones functions
export async function getVendorDeliveryZones(vendorId: string): Promise<VendorDeliveryZone[]> {
  console.log('[getVendorDeliveryZones] Fetching zones for vendor:', vendorId);
  
  const { data, error } = await supabase
    .from('vendor_delivery_zones')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('active', true)
    .order('zone_name');

  if (error) {
    console.error('[getVendorDeliveryZones] Error:', error);
    throw error;
  }

  console.log('[getVendorDeliveryZones] Found zones:', data?.length || 0);
  return (data || []) as VendorDeliveryZone[];
}

export async function createVendorDeliveryZone(zone: Omit<VendorDeliveryZone, 'id' | 'created_at' | 'updated_at'>): Promise<VendorDeliveryZone> {
  console.log('[createVendorDeliveryZone] Creating zone:', zone);
  
  const { data, error } = await supabase
    .from('vendor_delivery_zones')
    .insert(zone)
    .select()
    .single();

  if (error) {
    console.error('[createVendorDeliveryZone] Error:', error);
    throw error;
  }

  console.log('[createVendorDeliveryZone] Zone created:', data);
  return data as VendorDeliveryZone;
}

export async function updateVendorDeliveryZone(id: string, updates: Partial<Omit<VendorDeliveryZone, 'id' | 'created_at' | 'updated_at'>>): Promise<VendorDeliveryZone> {
  console.log('[updateVendorDeliveryZone] Updating zone:', id, updates);
  
  const { data, error } = await supabase
    .from('vendor_delivery_zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateVendorDeliveryZone] Error:', error);
    throw error;
  }

  console.log('[updateVendorDeliveryZone] Zone updated:', data);
  return data as VendorDeliveryZone;
}

export async function deleteVendorDeliveryZone(id: string): Promise<void> {
  console.log('[deleteVendorDeliveryZone] Deleting zone:', id);
  
  const { error } = await supabase
    .from('vendor_delivery_zones')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    console.error('[deleteVendorDeliveryZone] Error:', error);
    throw error;
  }

  console.log('[deleteVendorDeliveryZone] Zone deleted successfully');
}

// Product Restrictions functions
export async function getVendorProductRestrictions(vendorId: string): Promise<VendorProductRestriction[]> {
  console.log('[getVendorProductRestrictions] Fetching restrictions for vendor:', vendorId);
  
  const { data, error } = await supabase
    .from('vendor_product_restrictions')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getVendorProductRestrictions] Error:', error);
    throw error;
  }

  console.log('[getVendorProductRestrictions] Found restrictions:', data?.length || 0);
  return (data || []) as VendorProductRestriction[];
}

export async function createProductRestriction(restriction: Omit<VendorProductRestriction, 'id' | 'created_at' | 'updated_at'>): Promise<VendorProductRestriction> {
  console.log('[createProductRestriction] Creating restriction:', restriction);
  
  const { data, error } = await supabase
    .from('vendor_product_restrictions')
    .insert(restriction)
    .select()
    .single();

  if (error) {
    console.error('[createProductRestriction] Error:', error);
    throw error;
  }

  console.log('[createProductRestriction] Restriction created:', data);
  return data as VendorProductRestriction;
}

export async function deleteProductRestriction(id: string): Promise<void> {
  console.log('[deleteProductRestriction] Deleting restriction:', id);
  
  const { error } = await supabase
    .from('vendor_product_restrictions')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    console.error('[deleteProductRestriction] Error:', error);
    throw error;
  }

  console.log('[deleteProductRestriction] Restriction deleted successfully');
}

// Check product delivery restrictions
export async function checkProductDeliveryRestriction(
  vendorId: string,
  productId: string,
  customerCep: string
): Promise<DeliveryRestrictionCheck> {
  console.log('[checkProductDeliveryRestriction] Checking restrictions:', {
    vendorId,
    productId,
    customerCep
  });
  
  const { data, error } = await supabase.rpc('check_product_delivery_restriction', {
    p_vendor_id: vendorId,
    p_product_id: productId,
    p_customer_cep: customerCep
  });

  if (error) {
    console.error('[checkProductDeliveryRestriction] Error:', error);
    throw error;
  }

  const result = data?.[0] || {
    has_restriction: false,
    restriction_type: '',
    restriction_message: '',
    delivery_available: true
  };

  console.log('[checkProductDeliveryRestriction] Result:', result);
  return result;
}
