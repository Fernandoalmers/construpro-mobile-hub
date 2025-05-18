
import React from 'react';
import { Search } from 'lucide-react';
import { VendorOrder } from '@/services/vendor/orders';
import OrderItem from '../OrderItem';
import ListEmptyState from '@/components/common/ListEmptyState';

interface OrdersListProps {
  orders: VendorOrder[];
  onViewDetails: (orderId: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ 
  orders, 
  onViewDetails,
  hasFilters,
  onClearFilters,
  onRefresh
}) => {
  if (orders.length === 0) {
    return (
      <ListEmptyState
        icon={<Search className="h-12 w-12 text-gray-400" />}
        title="Nenhum pedido encontrado"
        description={
          hasFilters
            ? "Tente ajustar os filtros de busca" 
            : "Você ainda não tem nenhum pedido"
        }
        action={
          hasFilters ? {
            label: "Limpar filtros",
            onClick: onClearFilters
          } : {
            label: "Atualizar dados",
            onClick: onRefresh
          }
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderItem 
          key={order.id}
          order={order}
          onViewDetails={() => onViewDetails(order.id)}
        />
      ))}
    </div>
  );
};

export default OrdersList;
