
import { createOrder } from './order/createOrder';
import { getOrders } from './order/getOrders';
import { getOrderById, getOrderByIdDirect } from './order/getOrderById';
import type { CreateOrderPayload } from './order/types';

// Re-export types with 'export type' syntax for compatibility with isolatedModules
export type { CreateOrderPayload } from './order/types';

export const orderService = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByIdDirect
};
