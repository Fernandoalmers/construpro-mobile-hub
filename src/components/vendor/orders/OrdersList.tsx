
import React, { useEffect } from 'react';
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
  useEffect(() => {
    console.log("📋 [OrdersList] Component rendered with", orders?.length || 0, "orders");
    console.log("📋 [OrdersList] hasFilters:", hasFilters);
    
    if (!orders || orders.length === 0) {
      console.log("⚠️ [OrdersList] No orders received in props");
    } else if (orders?.length > 0) {
      console.log("✅ [OrdersList] Sample first order:", {
        id: orders[0]?.id,
        status: orders[0]?.status,
        cliente: orders[0]?.cliente?.nome,
        items_count: orders[0]?.itens?.length || 0
      });
    }
  }, [orders, hasFilters]);

  if (!orders || orders.length === 0) {
    console.log("⚠️ [OrdersList] Rendering empty state - no orders found");
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

  console.log("✅ [OrdersList] Rendering order list with", orders.length, "orders");
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
