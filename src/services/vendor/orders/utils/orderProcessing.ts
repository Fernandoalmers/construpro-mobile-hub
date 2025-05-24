
import { VendorOrder, OrderItem } from "../types";
import { fetchCustomerInfo } from "./clientInfoFetcher";
import { getVendorOrderItems, getProductDetails } from "./orderQueries";

/**
 * Process order items and get product details
 */
export const processOrderItems = async (orderId: string, vendorProductIds: string[]): Promise<OrderItem[]> => {
  const itemsData = await getVendorOrderItems(orderId, vendorProductIds);
  const items: OrderItem[] = [];
  
  for (const item of itemsData) {
    const productData = await getProductDetails(item.produto_id);
    
    items.push({
      id: item.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
      total: item.subtotal, // Map subtotal to total for type compatibility
      produto: productData ? {
        id: item.produto_id,
        nome: productData.nome || 'Produto',
        imagens: productData.imagens || [],
        descricao: productData.descricao || '',
        preco_normal: productData.preco_normal || item.preco_unitario,
        categoria: productData.categoria || ''
      } : undefined
    });
  }
  
  return items;
};

/**
 * Calculate vendor-specific total from items
 */
export const calculateVendorTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
};

/**
 * Build a complete VendorOrder object
 */
export const buildVendorOrder = async (
  orderData: any, 
  vendorId: string, 
  vendorProductIds: string[]
): Promise<VendorOrder> => {
  // Get customer info
  const customerInfo = await fetchCustomerInfo(orderData.cliente_id, vendorId);
  
  // Process order items
  const items = await processOrderItems(orderData.id, vendorProductIds);
  
  // Calculate vendor-specific total
  const vendorTotal = calculateVendorTotal(items);
  
  // Build full order object
  const fullOrder: VendorOrder = {
    id: orderData.id,
    status: orderData.status,
    forma_pagamento: orderData.forma_pagamento,
    valor_total: vendorTotal, // Use vendor-specific total
    endereco_entrega: orderData.endereco_entrega,
    created_at: orderData.created_at,
    data_criacao: orderData.created_at,
    cliente: {
      id: orderData.cliente_id,
      nome: customerInfo?.nome || 'Cliente',
      email: customerInfo?.email || '',
      telefone: customerInfo?.telefone || '',
      usuario_id: orderData.cliente_id,
      vendedor_id: vendorId,
      total_gasto: customerInfo?.total_gasto || 0
    },
    itens: items
  };
  
  return fullOrder;
};

/**
 * Apply search filter to orders
 */
export const applySearchFilter = (orders: VendorOrder[], searchTerm?: string): VendorOrder[] => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return orders;
  }
  
  const searchTermLower = searchTerm.toLowerCase();
  return orders.filter(order => 
    order.cliente?.nome?.toLowerCase().includes(searchTermLower) ||
    order.cliente?.email?.toLowerCase().includes(searchTermLower) ||
    order.id.toLowerCase().includes(searchTermLower)
  );
};
