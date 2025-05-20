
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
      // Log more diagnostic info if we have no orders but should have some
      if (!hasFilters) {
        console.log("⚠️ [OrdersList] No filters active, but still no orders - might be a data issue");
      }
    } else if (orders?.length > 0) {
      console.log("✅ [OrdersList] Sample first order:", {
        id: orders[0]?.id,
        status: orders[0]?.status,
        cliente: orders[0]?.cliente?.nome,
        items_count: orders[0]?.itens?.length || 0
      });
      
      // Log more detailed info about order structure to help with debugging
      console.log("✅ [OrdersList] First order full structure:", JSON.stringify(orders[0], null, 2));
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
            : "Você ainda não recebeu nenhum pedido ou os dados estão sendo carregados. Tente ativar o modo de depuração."
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
