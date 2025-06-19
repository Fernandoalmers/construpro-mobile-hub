
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
