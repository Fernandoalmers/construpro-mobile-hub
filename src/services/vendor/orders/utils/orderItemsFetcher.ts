
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

// Define strict literal types to prevent any potential recursion issues
export type StringImageArray = readonly string[];
export type ObjectImageArray = readonly {url: string}[];
export type ProductImageType = StringImageArray | ObjectImageArray | null;

// Define a standalone product type with no circular references
export interface ProductData {
  id: string;
  nome: string;
  descricao: string | null;
  preco_normal: number;
  imagens: ProductImageType;
}

// Image processing function with strict typing
function processImagens(rawImagens: unknown): ProductImageType {
  if (!rawImagens) return null;
  
  // For string input
  if (typeof rawImagens === 'string') {
    return [rawImagens] as StringImageArray;
  }
  
  // For array input
  if (Array.isArray(rawImagens)) {
    // Process strings and objects separately to maintain type safety
    const stringImages: string[] = [];
    const objectImages: {url: string}[] = [];
    
    rawImagens.forEach((img: unknown) => {
      if (typeof img === 'string') {
        stringImages.push(img);
      } else if (typeof img === 'object' && img !== null && 'url' in img && typeof img.url === 'string') {
        objectImages.push({url: img.url});
      }
    });
    
    // Return the appropriate type based on content
    if (stringImages.length > 0 && objectImages.length === 0) {
      return stringImages as StringImageArray;
    } else if (objectImages.length > 0 && stringImages.length === 0) {
      return objectImages as ObjectImageArray;
    } else if (stringImages.length > 0) {
      // If mixed, prefer string format for consistency
      return [...stringImages, ...objectImages.map(obj => obj.url)] as StringImageArray;
    }
  }
  
  return null;
}

// Fetch product data with explicit typing
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, ProductData>> => {
  if (!productIds.length) return {};
  
  try {
    // Use explicit selects with simplified query
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

// Completely standalone order item type with no references that could cause circular dependencies
export interface SimpleOrderItem {
  id: string;
  order_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  total: number;
  created_at?: string;
  produto?: ProductData | null;
}

// Create a map of order items with explicit typing
export const createOrderItemsMap = (
  orderItemsData: Array<Record<string, unknown>>, 
  productMap: Record<string, ProductData>
): Record<string, SimpleOrderItem[]> => {
  const orderItemsMap: Record<string, SimpleOrderItem[]> = {};
  
  orderItemsData.forEach(item => {
    const orderId = item.order_id as string;
    if (!orderItemsMap[orderId]) {
      orderItemsMap[orderId] = [];
    }
    
    // Get product data
    const produto = productMap[(item.produto_id as string)] || null;
    
    // Create order item with explicit properties to avoid circular references
    const orderItem: SimpleOrderItem = {
      id: item.id as string,
      order_id: item.order_id as string,
      produto_id: item.produto_id as string,
      quantidade: item.quantidade as number,
      preco_unitario: item.preco_unitario as number,
      subtotal: (item.subtotal as number) || 0,
      total: (item.subtotal as number) || ((item.quantidade as number) * (item.preco_unitario as number)) || 0,
      produto: produto,
      created_at: item.created_at as string | undefined
    };
    
    orderItemsMap[orderId].push(orderItem);
  });
  
  return orderItemsMap;
};

// Fetch order items with explicit typing
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<Array<Record<string, unknown>>> => {
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
