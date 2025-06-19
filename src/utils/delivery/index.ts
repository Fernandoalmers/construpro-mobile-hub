
// Main delivery utilities exports
export * from './types';
export * from './logger';
export * from './vendorZones';
export * from './cepValidation';
export * from './storeLocation';
export * from './vendorDelivery';
export * from './productDelivery';
export * from './fallback';

// Re-export main functions for backward compatibility
export { getProductDeliveryInfo } from './productDelivery';
export { getVendorDeliveryInfo } from './vendorDelivery';
export { getStoreLocationInfo } from './storeLocation';
export { getVendorDeliveryZonesInfo } from './vendorZones';

// Legacy support - deprecated functions
import { fallbackDeliveryInfo } from './fallback';

/**
 * @deprecated Use getVendorDeliveryInfo instead
 */
export async function getDeliveryInfo(
  storeCep?: string,
  storeIbge?: string,
  customerCep?: string,
  customerIbge?: string
) {
  console.warn('[getDeliveryInfo] This function is deprecated. Use getVendorDeliveryInfo instead.');
  return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
}
