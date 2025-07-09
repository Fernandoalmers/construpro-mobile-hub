
import { useState } from 'react';
import { VendorOrder } from '@/services/vendor/orders/types';

export const orderStatuses = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'processando', label: 'Em processamento' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' }
];

export const useOrderFilters = (orders: VendorOrder[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      (order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || 
      (order.status && order.status.toLowerCase() === filterStatus);
    
    return matchesSearch && matchesStatus;
  });

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders,
    orderStatuses
  };
};
