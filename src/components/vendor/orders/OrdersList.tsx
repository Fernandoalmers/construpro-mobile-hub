
import React, { useEffect } from 'react';
import { Search } from 'lucide-react';
import { VendorOrder } from '@/services/vendor/orders/types';
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
  console.log("📋 [OrdersList] Component rendered with props:", {
    ordersCount: orders?.length || 0,
    hasFilters,
    ordersData: orders?.slice(0, 3).map(o => ({ id: o.id, status: o.status, total: o.valor_total }))
  });

  useEffect(() => {
    console.log("📋 [OrdersList] Component effect triggered - orders changed:", {
      count: orders?.length || 0,
      hasFilters,
      isArray: Array.isArray(orders),
      firstOrderId: orders?.[0]?.id
    });
    
    if (!orders || orders.length === 0) {
      console.log("⚠️ [OrdersList] No orders received in props");
      if (!hasFilters) {
        console.log("⚠️ [OrdersList] No filters active, but still no orders - might be a data issue");
      }
    } else if (orders?.length > 0) {
      console.log("✅ [OrdersList] Orders found! Sample first order:", {
        id: orders[0]?.id,
        status: orders[0]?.status,
        cliente: orders[0]?.cliente?.nome,
        items_count: orders[0]?.itens?.length || 0,
        created_at: orders[0]?.created_at,
        total: orders[0]?.valor_total
      });
      
      console.log("📋 [OrdersList] All order IDs:", orders.map(o => o.id));
      
      // Check if orders have the required properties
      orders.forEach((order, index) => {
        console.log(`📋 [OrdersList] Order ${index + 1} validation:`, {
          id: order.id,
          hasId: !!order.id,
          hasStatus: !!order.status,
          hasValorTotal: order.valor_total !== undefined,
          hasCliente: !!order.cliente,
          hasItens: Array.isArray(order.itens),
          status: order.status,
          valor_total: order.valor_total
        });
      });
    }
  }, [orders, hasFilters]);

  // Early return for empty orders
  if (!orders || orders.length === 0) {
    console.log("⚠️ [OrdersList] Rendering empty state - no orders found");
    return (
      <ListEmptyState
        icon={<Search className="h-12 w-12 text-gray-400" />}
        title="Nenhum pedido encontrado"
        description={
          hasFilters
            ? "Tente ajustar os filtros de busca" 
            : "Você ainda não recebeu nenhum pedido ou os dados estão sendo carregados."
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
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="font-mono text-blue-800">
            [OrdersList Debug] Rendering {orders.length} orders
          </p>
        </div>
      )}
      
      {orders.map((order, index) => {
        console.log(`🎨 [OrdersList] Rendering order ${index + 1}:`, {
          id: order.id,
          status: order.status,
          total: order.valor_total
        });
        
        return (
          <OrderItem 
            key={order.id}
            order={order}
            onViewDetails={() => {
              console.log('🔍 [OrdersList] Opening order details:', order.id);
              onViewDetails(order.id);
            }}
          />
        );
      })}
    </div>
  );
};

export default OrdersList;
