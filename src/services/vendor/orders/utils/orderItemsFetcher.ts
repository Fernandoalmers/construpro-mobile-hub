import { supabase } from '@/integrations/supabase/client';

// Define ProductId interface to simplify typing
interface ProductId {
  id: string;
}

// Helper to get vendor product IDs with improved error handling
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log('Getting product IDs for vendor:', vendorId);
    
    // Check if vendorId is valid
    if (!vendorId) {
      console.error('Invalid vendor ID provided');
      return [];
    }
    
    // Get all produtos owned by this vendor
    const result = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
      
    // Handle error explicitly  
    if (result.error) {
      console.error('Error fetching vendor products:', result.error);
      return [];
    }
    
    // Safely handle the data with explicit typing to solve the "Type instantiation is excessively deep" error
    type SimpleProductResult = { id: string }[];
    const data = result.data as SimpleProductResult | null;
    const vendorProducts: ProductId[] = Array.isArray(data) ? data : [];
    
    if (vendorProducts.length === 0) {
      console.log('No products found in produtos table, checking alternative table');
      
      // Try alternate product table as backup
      const alternateResult = await supabase
        .from('products')
        .select('id')
        .eq('vendedor_id', vendorId);
      
      // Handle error explicitly
      if (alternateResult.error) {
        console.error('Error fetching products:', alternateResult.error);
        return [];
      }
      
      // Safely handle alternate data with explicit typing
      type SimpleProductResult = { id: string }[];
      const alternateData = alternateResult.data as SimpleProductResult | null;
      const alternateProducts: { id: string }[] = Array.isArray(alternateData) ? alternateData : [];
      
      if (alternateProducts.length === 0) {
        console.log('No products found in alternate table either');
        return [];
      }
      
      // Extract product IDs with clear typing
      const productIds = alternateProducts.map(item => item.id);
      console.log(`Found ${productIds.length} products in alternate table`);
      return productIds;
    }
    
    console.log(`Found ${vendorProducts.length} products for this vendor`);
    return vendorProducts.map(p => p.id);
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// Define a simple type for product images without circular references
export type ProductImageType = string[] | null;

// Define a standalone product type with no circular references
export interface ProductData {
  id: string;
  nome: string;
  descricao: string | null;
  preco_normal: number;
  imagens: ProductImageType;
}

// Simplified image processing function
function processImagens(rawImagens: unknown): ProductImageType {
  if (!rawImagens) return null;
  
  // For string input
  if (typeof rawImagens === 'string') {
    return [rawImagens];
  }
  
  // For array input
  if (Array.isArray(rawImagens)) {
    const result: string[] = [];
    
    for (const img of rawImagens) {
      if (typeof img === 'string') {
        result.push(img);
      } else if (typeof img === 'object' && img !== null && 'url' in img) {
        // Extract the URL string from an object with url property
        const urlValue = (img as { url: string }).url;
        if (typeof urlValue === 'string') {
          result.push(urlValue);
        }
      }
    }
    
    return result.length > 0 ? result : null;
  }
  
  return null;
}

// Fetch product data with explicit typing
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, ProductData>> => {
  if (!productIds.length) return {};
  
  try {
    console.log(`Fetching product data for ${productIds.length} products`);
    
    // Explicitly define the type we expect from the query
    type RawProductData = {
      id: string;
      nome: string;
      descricao: string | null;
      preco_normal: number;
      imagens: unknown;
    };
    
    // Use IN filter to get only the requested products
    const result = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco_normal, imagens')
      .in('id', productIds);
    
    if (result.error) {
      console.error('Error fetching products:', result.error);
      return {};
    }
    
    // Safely handle the data with explicit typing
    const data = result.data;
    const produtos: RawProductData[] = Array.isArray(data) ? data : [];
    
    if (produtos.length === 0) {
      console.log('No products found matching the requested IDs');
      return {};
    }
    
    console.log(`Found ${produtos.length} products out of ${productIds.length} requested`);
    
    const productMap: Record<string, ProductData> = {};
    
    produtos.forEach(product => {
      productMap[product.id] = {
        id: product.id,
        nome: product.nome || '',
        descricao: product.descricao,
        preco_normal: product.preco_normal || 0,
        imagens: processImagens(product.imagens)
      };
    });
    
    return productMap;
  } catch (error) {
    console.error('Error fetching products for items:', error);
    return {};
  }
};

// Simple standalone type for order items
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

// Create a map of order items
export const createOrderItemsMap = (
  orderItemsData: Array<Record<string, unknown>>, 
  productMap: Record<string, ProductData>
): Record<string, SimpleOrderItem[]> => {
  const orderItemsMap: Record<string, SimpleOrderItem[]> = {};
  
  console.log(`Creating order items map from ${orderItemsData.length} items`);
  
  orderItemsData.forEach(item => {
    // Validate required fields
    const orderId = item.order_id as string;
    const produtoId = item.produto_id as string;
    
    if (!orderId) {
      console.warn('Order item missing order_id:', item);
      return;
    }
    
    if (!orderItemsMap[orderId]) {
      orderItemsMap[orderId] = [];
    }
    
    // Get product data
    const produto = productMap[produtoId] || null;
    
    // Handle missing product gracefully
    if (!produto) {
      console.warn(`Product not found for order item, product ID: ${produtoId}`);
    }
    
    // Create order item with explicit properties
    const orderItem: SimpleOrderItem = {
      id: item.id as string,
      order_id: orderId,
      produto_id: produtoId,
      quantidade: item.quantidade as number,
      preco_unitario: item.preco_unitario as number,
      subtotal: (item.subtotal as number) || 0,
      total: (item.subtotal as number) || ((item.quantidade as number) * (item.preco_unitario as number)) || 0,
      produto: produto,
      created_at: item.created_at as string | undefined
    };
    
    orderItemsMap[orderId].push(orderItem);
  });
  
  console.log(`Created order items map with ${Object.keys(orderItemsMap).length} unique orders`);
  
  return orderItemsMap;
};

// Fetch order items
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<Array<Record<string, unknown>>> => {
  if (!productIds.length) return [];
  
  try {
    console.log(`Fetching order items for ${productIds.length} product IDs`);
    
    const result = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal, created_at')
      .in('produto_id', productIds);
    
    if (result.error) {
      console.error('Error fetching order items:', result.error);
      return [];
    }
    
    // Safely handle data with explicit casting
    const data = result.data;
    const orderItemsData: Array<Record<string, unknown>> = Array.isArray(data) ? data : [];
    
    if (orderItemsData.length === 0) {
      console.log('No order items found for vendor products');
      return [];
    }
    
    console.log(`Found ${orderItemsData.length} order items for vendor products`);
    
    // Extract unique order IDs for diagnostics
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id as string))];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    return orderItemsData;
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
};
