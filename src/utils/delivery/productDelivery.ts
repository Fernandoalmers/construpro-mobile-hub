
import { checkProductDeliveryRestriction } from '@/services/vendor/deliveryZones';
import { ProductDeliveryInfo } from './types';
import { logWithTimestamp, withTimeout, withRetry } from './logger';
import { getVendorDeliveryZonesInfo } from './vendorZones';
import { getVendorDeliveryInfo } from './vendorDelivery';

/**
 * Verifica informações de entrega do produto com timeouts aumentados e melhor fallback
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
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [getProductDeliveryInfo] 🚀 FUNCTION CALLED - Starting delivery check for product:`, {
    vendorId,
    productId,
    customerCep,
    storeCep,
    storeIbge,
    customerIbge
  });

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
    console.log(`[${timestamp}] [getProductDeliveryInfo] ❌ No customer CEP provided`);
    logWithTimestamp('[getProductDeliveryInfo] No customer CEP provided, getting vendor zones info');
    
    try {
      const zonesInfo = await withTimeout(
        getVendorDeliveryZonesInfo(vendorId),
        5000,
        'Vendor zones info fetch'
      );
      
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
      console.error(`[${timestamp}] [getProductDeliveryInfo] Error getting zones info:`, error);
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

  console.log(`[${timestamp}] [getProductDeliveryInfo] ✅ Customer CEP provided: ${customerCep}`);

  // Check for product-specific restrictions with increased timeout and retry
  let restrictionCheck = null;
  try {
    console.log(`[${timestamp}] [getProductDeliveryInfo] 🔍 Checking product restrictions...`);
    logWithTimestamp('[getProductDeliveryInfo] Checking product restrictions...');
    
    restrictionCheck = await withRetry(async () => {
      return await withTimeout(
        checkProductDeliveryRestriction(vendorId, productId, customerCep),
        8000, // Aumentado de 3s para 8s
        'Product restriction check'
      );
    }, 2, 1500, 'product restriction check');

    console.log(`[${timestamp}] [getProductDeliveryInfo] ✅ Restriction check completed:`, restrictionCheck);
    logWithTimestamp('[getProductDeliveryInfo] Restriction check completed:', restrictionCheck);

    if (restrictionCheck.has_restriction) {
      console.log(`[${timestamp}] [getProductDeliveryInfo] ✅ Product restriction found:`, restrictionCheck);
      logWithTimestamp('[getProductDeliveryInfo] ✅ Product restriction found:', restrictionCheck);
      
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
      console.log(`[${timestamp}] [getProductDeliveryInfo] Completed with restrictions in ${elapsed}ms`);
      logWithTimestamp(`[getProductDeliveryInfo] Completed with restrictions in ${elapsed}ms`);
      return result;
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${timestamp}] [getProductDeliveryInfo] ⚠️ Restriction check failed after ${elapsed}ms, continuing with vendor zones:`, error);
    logWithTimestamp(`[getProductDeliveryInfo] ⚠️ Restriction check failed after ${elapsed}ms, continuing with vendor zones:`, error);
    // Continue with vendor delivery zones instead of failing
  }

  // SEMPRE tentar verificar zonas do vendedor quando temos CEP
  console.log(`[${timestamp}] [getProductDeliveryInfo] 🔍 No restrictions found or check failed, checking vendor delivery zones...`);
  logWithTimestamp('[getProductDeliveryInfo] No restrictions found or check failed, checking vendor delivery zones...');
  
  try {
    console.log(`[${timestamp}] [getProductDeliveryInfo] 🚀 CALLING getVendorDeliveryInfo with vendorId: ${vendorId}, customerCep: ${customerCep}`);
    
    const deliveryInfo = await withRetry(async () => {
      return await withTimeout(
        getVendorDeliveryInfo(vendorId, customerCep),
        10000, // Aumentado de 3s para 10s
        'Vendor delivery info'
      );
    }, 2, 2000, 'vendor delivery info');
    
    const result = {
      ...deliveryInfo,
      productId,
      vendorId,
      hasRestrictions: false,
      deliveryAvailable: true
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`[${timestamp}] [getProductDeliveryInfo] ✅ Completed successfully in ${elapsed}ms`, result);
    logWithTimestamp(`[getProductDeliveryInfo] ✅ Completed successfully in ${elapsed}ms`, result);
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${timestamp}] [getProductDeliveryInfo] ❌ Vendor delivery info failed after ${elapsed}ms:`, error);
    logWithTimestamp(`[getProductDeliveryInfo] ❌ Vendor delivery info failed after ${elapsed}ms:`, error);
    
    // Enhanced fallback - ainda tenta fornecer informações úteis
    try {
      const zonesInfo = await withTimeout(
        getVendorDeliveryZonesInfo(vendorId),
        5000,
        'Fallback zones info'
      );
      
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
