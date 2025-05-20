
import { createOrder } from './order/createOrder';
import { getOrders } from './order/getOrders';
import { getOrderById, getOrderByIdDirect } from './order/getOrderById';
import { CreateOrderPayload } from './order/types';

export { CreateOrderPayload } from './order/types';

export const orderService = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByIdDirect
};
