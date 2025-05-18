
import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '../types';

// Helper to get vendor product IDs with improved error handling
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log('Getting product IDs for vendor:', vendorId);
    
    // Get all produtos owned by this vendor
    const { data: vendorProducts, error: productsError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
    
    if (productsError) {
      console.error('Error fetching vendor products:', productsError);
      return [];
    }
    
    if (!vendorProducts || vendorProducts.length === 0) {
      console.log('No products found for vendor');
      
      // Try alternate product table as backup
      const { data: altProducts, error: altError } = await supabase
        .from('products') // Alternative product table that might be used
        .select('id')
        .eq('vendedor_id', vendorId);
        
      if (altError || !altProducts || altProducts.length === 0) {
        console.log('No products found in alternate table either');
        return [];
      }
      
      console.log(`Found ${altProducts.length} products in alternate table`);
      return altProducts.map(p => p.id);
    }
    
    console.log(`Found ${vendorProducts.length} products for this vendor`);
    return vendorProducts.map(p => p.id);
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// Define a simplified product type without circular references
export interface ProductData {
  id: string;
  nome: string;
  descricao: string | null;
  preco_normal: number;
  imagens: Array<string | { url: string }> | null;
}

// Process images from various possible formats - standalone function to simplify types
function processImagens(rawImagens: any): Array<string | { url: string }> | null {
  if (!rawImagens) return null;
  
  let processedImages: Array<string | { url: string }> = [];
  
  if (typeof rawImagens === 'string') {
    return [rawImagens];
  } else if (Array.isArray(rawImagens)) {
    processedImages = rawImagens.map((img: any) => {
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && img && img.url) return img;
      return '';
    }).filter(Boolean);
    
    return processedImages.length > 0 ? processedImages : null;
  }
  
  return null;
}

// Fetch product data for a list of product IDs
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, ProductData>> => {
  if (!productIds.length) return {};
  
  try {
    // Use minimal explicit selects to avoid complex type inference
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco_normal, imagens');
    
    const productMap: Record<string, ProductData> = {};
    
    if (produtos) {
      produtos.forEach(product => {
        productMap[product.id] = {
          id: product.id,
          nome: product.nome || '',
          descricao: product.descricao,
          preco_normal: product.preco_normal || 0,
          imagens: processImagens(product.imagens)
        };
      });
    }
    
    return productMap;
  } catch (error) {
    console.error('Error fetching products for items:', error);
    return {};
  }
};

// Create a simplified order item type to avoid circular references
export type SimpleOrderItem = {
  id: string;
  order_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  total: number;
  created_at?: string;
  produto?: ProductData | null;
};

// Process order items to create a map keyed by order_id
export const createOrderItemsMap = (
  orderItemsData: any[], 
  productMap: Record<string, ProductData>
): Record<string, SimpleOrderItem[]> => {
  const orderItemsMap: Record<string, SimpleOrderItem[]> = {};
  
  orderItemsData.forEach(item => {
    if (!orderItemsMap[item.order_id]) {
      orderItemsMap[item.order_id] = [];
    }
    
    // Get product data
    const produto = productMap[item.produto_id] || null;
    
    // Create order item with explicit properties to avoid circular references
    const orderItem: SimpleOrderItem = {
      id: item.id,
      order_id: item.order_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal || 0,
      total: item.subtotal || (item.quantidade * item.preco_unitario) || 0,
      produto: produto,
      created_at: item.created_at
    };
    
    orderItemsMap[item.order_id].push(orderItem);
  });
  
  return orderItemsMap;
};

// Fetch order items for a list of product IDs
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<any[]> => {
  if (!productIds.length) return [];
  
  try {
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal, created_at')
      .in('produto_id', productIds);
    
    if (orderItemsError || !orderItemsData) {
      console.log('Error or no order items found for vendor products');
      return [];
    }
    
    return orderItemsData;
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
};
