
import { checkProductDeliveryRestriction } from '@/services/vendor/deliveryZones';
import { ProductDeliveryInfo } from './types';
import { logWithTimestamp, withTimeout } from './logger';
import { getVendorDeliveryZonesInfo } from './vendorZones';
import { getVendorDeliveryInfo } from './vendorDelivery';

/**
 * Compara a localização da loja com a do cliente e verifica restrições de produto
 */
export async function getProductDeliveryInfo(
  vendorId: string,
  productId: string,
  customerCep?: string,
  storeCep?: string,
  storeIbge?: string,
  customerIbge?: string
): Promise<ProductDeliveryInfo> {
  const startTime = Date.now();
  logWithTimestamp('[getProductDeliveryInfo] Starting delivery check for product:', {
    vendorId,
    productId,
    customerCep,
    storeCep,
    storeIbge,
    customerIbge
  });

  // Enhanced fallback when no customer CEP is provided
  if (!customerCep) {
    logWithTimestamp('[getProductDeliveryInfo] No customer CEP provided, getting vendor zones info');
    
    try {
      const zonesInfo = await getVendorDeliveryZonesInfo(vendorId);
      
      return {
        productId,
        vendorId,
        isLocal: false,
        message: zonesInfo.hasZones 
          ? `${zonesInfo.message}. Informe seu CEP para calcular o frete exato`
          : 'Informe seu CEP para calcular o frete',
        hasRestrictions: false,
        deliveryAvailable: zonesInfo.hasZones,
        estimatedTime: zonesInfo.hasZones ? 'Consulte com seu CEP' : undefined
      };
    } catch (error) {
      logWithTimestamp('[getProductDeliveryInfo] Error getting zones info:', error);
      return {
        productId,
        vendorId,
        isLocal: false,
        message: 'Informe seu CEP para calcular o frete',
        hasRestrictions: false,
        deliveryAvailable: true
      };
    }
  }

  // Check for product-specific restrictions with shorter timeout and better fallback
  let restrictionCheck = null;
  try {
    logWithTimestamp('[getProductDeliveryInfo] Checking product restrictions with timeout...');
    
    // Reduce timeout to 3 seconds to avoid long waits
    restrictionCheck = await withTimeout(
      checkProductDeliveryRestriction(vendorId, productId, customerCep),
      3000
    );

    logWithTimestamp('[getProductDeliveryInfo] Restriction check completed:', restrictionCheck);

    if (restrictionCheck.has_restriction) {
      logWithTimestamp('[getProductDeliveryInfo] Product restriction found:', restrictionCheck);
      
      const result = {
        productId,
        vendorId,
        isLocal: false,
        message: restrictionCheck.restriction_message || 'Restrição de entrega para esta região',
        hasRestrictions: true,
        restrictionType: restrictionCheck.restriction_type,
        deliveryAvailable: restrictionCheck.delivery_available
      };
      
      const elapsed = Date.now() - startTime;
      logWithTimestamp(`[getProductDeliveryInfo] Completed with restrictions in ${elapsed}ms`);
      return result;
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Restriction check failed after ${elapsed}ms:`, error);
    
    // Continue with vendor delivery zones instead of failing
    logWithTimestamp('[getProductDeliveryInfo] Proceeding with vendor delivery zones due to restriction check failure');
  }

  // If no restrictions or restriction check failed, check vendor delivery zones
  logWithTimestamp('[getProductDeliveryInfo] No restrictions found or check failed, checking vendor delivery zones...');
  
  try {
    const deliveryInfo = await withTimeout(
      getVendorDeliveryInfo(vendorId, customerCep),
      3000 // Reduced timeout to 3 seconds
    );
    
    const result = {
      ...deliveryInfo,
      productId,
      vendorId,
      hasRestrictions: false,
      deliveryAvailable: true
    };
    
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Completed successfully in ${elapsed}ms`);
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Vendor delivery info failed after ${elapsed}ms:`, error);
    
    // Enhanced fallback with zone information
    try {
      const zonesInfo = await getVendorDeliveryZonesInfo(vendorId);
      return {
        productId,
        vendorId,
        isLocal: false,
        message: zonesInfo.hasZones 
          ? 'Frete calculado no checkout - verifique se seu CEP está na área de entrega'
          : 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
        hasRestrictions: false,
        deliveryAvailable: true
      };
    } catch {
      // Ultimate fallback
      return {
        productId,
        vendorId,
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
        hasRestrictions: false,
        deliveryAvailable: true
      };
    }
  }
}
