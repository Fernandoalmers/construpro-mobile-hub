export interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  hasRestrictions?: boolean;
  restrictionType?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
}

export interface ProductDeliveryInfo extends DeliveryInfo {
  productId: string;
  vendorId: string;
}

export interface VendorZonesInfo {
  hasZones: boolean;
  zonesInfo: string[];
  message: string;
}

export interface StoreLocationInfo {
  cep?: string;
  ibge?: string;
  zona?: string;
}

// Re-export the main type from the service
export type { DeliveryZone } from '@/services/deliveryZoneService';

// Keep DeliveryZoneResult for backward compatibility
export interface DeliveryZoneResult {
  zone_id: string;
  vendor_id: string;
  zone_name: string;
  delivery_fee: number;
  delivery_time: string;
}
