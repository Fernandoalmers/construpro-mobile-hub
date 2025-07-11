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

// Updated DeliveryZone interface to include vendor_id
export interface DeliveryZone {
  zone_id: string;
  vendor_id: string;
  zone_name: string;
  delivery_fee: number;
  delivery_time: string;
}

// Keep DeliveryZoneResult for backward compatibility
export interface DeliveryZoneResult extends DeliveryZone {}
