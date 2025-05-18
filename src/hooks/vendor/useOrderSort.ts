
import { useState } from 'react';
import { VendorOrder } from '@/services/vendor/orders';

export type OrderSortField = 'created_at' | 'valor_total' | 'status';
export type SortDirection = 'asc' | 'desc';

export const useOrderSort = (orders: VendorOrder[]) => {
  const [sortField, setSortField] = useState<OrderSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleSort = (field: OrderSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'created_at':
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        compareValue = dateA - dateB;
        break;
      
      case 'valor_total':
        compareValue = (a.valor_total || 0) - (b.valor_total || 0);
        break;
        
      case 'status':
        const statusOrder = { 'pendente': 0, 'confirmado': 1, 'processando': 2, 'enviado': 3, 'entregue': 4, 'cancelado': 5 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 999;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 999;
        compareValue = statusA - statusB;
        break;
        
      default:
        compareValue = 0;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  return {
    sortField,
    sortDirection,
    toggleSort,
    sortedOrders
  };
};
