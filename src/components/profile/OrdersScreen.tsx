import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, TruckIcon, ShoppingBag, ArrowRight, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { getProductImageUrl } from '@/services/order/getOrders';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';
import { OrderData } from '@/services/order/types';
import ProductImage from '../admin/products/components/ProductImage';
import { useOrderRealtimeSync } from '@/hooks/useOrderRealtimeSync';
const OrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated
  } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [debugMode, setDebugMode] = useState(false);

  // Setup enhanced real-time updates for customer orders
  useOrderRealtimeSync({
    mode: 'customer'
  });

  // Security check - redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      console.warn("🚫 [OrdersScreen] User not authenticated, redirecting to login");
      toast.error("Você precisa estar logado para ver seus pedidos");
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Enhanced query with better error handling and debugging
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: async () => {
      console.log("🔄 [OrdersScreen] React Query executing orderService.getOrders");
      console.log("🔄 [OrdersScreen] Current user:", {
        id: user?.id,
        email: user?.email
      });
      const result = await orderService.getOrders();
      console.log("🔄 [OrdersScreen] React Query result:", {
        ordersCount: result.length,
        orders: result.map(o => ({
          id: o.id.substring(0, 8),
          status: o.status
        }))
      });
      return result;
    },
    staleTime: 10 * 1000,
    // Reduced to 10 seconds for better real-time feel
    enabled: isAuthenticated && !!user?.id,
    retry: (failureCount, error) => {
      console.log(`🔄 [OrdersScreen] Query retry attempt ${failureCount}:`, error);
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Enhanced logging for debugging
  React.useEffect(() => {
    if (user?.id) {
      console.log(`🔐 [OrdersScreen] Component mounted for user: ${user.id}`);
      console.log(`📧 [OrdersScreen] User email: ${user.email}`);
      console.log(`📊 [OrdersScreen] Orders loaded: ${orders.length}`);
      if (orders.length > 0) {
        console.log("📦 [OrdersScreen] First few orders:", orders.slice(0, 3).map(o => ({
          id: o.id.substring(0, 8),
          status: o.status,
          itemsCount: o.items?.length || 0,
          created_at: o.created_at
        })));
      }
    }
  }, [user?.id, user?.email, orders]);
  if (error) {
    console.error('❌ [OrdersScreen] Query error:', error);
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return <LoadingState text="Verificando autenticação..." />;
  }

  // Filter orders by status if not "todos"
  const filteredOrders = statusFilter === "todos" ? orders : orders.filter(order => {
    if (statusFilter === "emProcesso") {
      return ["Em Separação", "Confirmado", "Em Trânsito", "Processando", "confirmado", "processando", "enviado"].includes(order.status);
    }
    if (statusFilter === "concluidos") {
      return ["Entregue", "entregue", "Finalizado", "finalizado", "Concluído", "concluido"].includes(order.status);
    }
    return order.status === statusFilter || order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "entregue":
        return "bg-green-100 text-green-800";
      case "em trânsito":
      case "enviado":
        return "bg-blue-100 text-blue-800";
      case "em separação":
      case "processando":
        return "bg-yellow-100 text-yellow-800";
      case "confirmado":
        return "bg-purple-100 text-purple-800";
      case "pendente":
        return "bg-orange-100 text-orange-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to safely get product info from an order
  const getOrderSummary = (order: OrderData) => {
    const orderItems = order.items || [];
    if (!orderItems.length) {
      return {
        firstItemName: 'Pedido',
        additionalItemsCount: 0,
        hasItems: false
      };
    }
    const firstItem = orderItems[0];
    const firstItemProduct = firstItem.produto;
    const firstItemName = firstItemProduct?.nome || 'Produto';
    const additionalItemsCount = orderItems.length - 1;
    return {
      firstItemName,
      additionalItemsCount,
      hasItems: true,
      firstItem
    };
  };
  const handleTrackOrder = (orderId: string) => {
    toast.info(`Acompanhamento do pedido ${orderId.substring(0, 8)}`);
    // In a real app, this would navigate to a tracking page
  };
  const handleReorder = (orderId: string) => {
    // In a real app, this would add items to cart from this order
    toast.success("Itens adicionados ao carrinho");
    navigate('/marketplace');
  };
  const handleRetry = () => {
    console.log("🔄 [OrdersScreen] Manual retry triggered");
    toast.info("Tentando carregar pedidos novamente...");
    refetch();
  };
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };
  if (isLoading) {
    return <LoadingState text="Carregando seus pedidos..." />;
  }
  return <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header - Sticky header for better mobile experience */}
      <div className="bg-construPro-blue p-4 pt-10 sticky top-0 z-10 shadow-md">
        <div className="flex items-center mb-3">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Pedidos</h1>
          {user?.id}
        </div>
        
        {/* Debug Panel */}
        {debugMode && <div className="bg-white/10 p-3 rounded mb-3 text-xs text-white">
            <p><strong>Debug Info:</strong></p>
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
            <p>Orders Count: {orders.length}</p>
            <p>Filtered Count: {filteredOrders.length}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Refetching: {isRefetching ? 'Yes' : 'No'}</p>
            <p>Error: {error ? 'Yes' : 'No'}</p>
            <p>Last Fetch: {new Date().toLocaleTimeString()}</p>
            <p>Real-time: Active</p>
          </div>}
        
        {/* Tabs - Improved for mobile view */}
        <div className="px-0 -mt-1 -mx-1">
          <Card className="p-1 shadow-none rounded-b-none">
            <Tabs defaultValue="todos" onValueChange={setStatusFilter} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-50 p-0.5 h-auto">
                <TabsTrigger value="todos" className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="emProcesso" className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Em Processo
                </TabsTrigger>
                <TabsTrigger value="concluidos" className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Concluídos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Error Display */}
      {error && <div className="p-4">
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Erro ao carregar pedidos</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error instanceof Error ? error.message : 'Erro desconhecido'}
                </p>
              </div>
              <button onClick={handleRetry} className="bg-red-100 hover:bg-red-200 p-2 rounded-md transition-colors" disabled={isRefetching}>
                <RefreshCw size={16} className={`text-red-600 ${isRefetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </Card>
        </div>}
      
      {/* Orders List - Improved card design for mobile */}
      <div className="p-4 space-y-3 pb-24">
        {filteredOrders.length === 0 ? <div className="text-center py-10">
            <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mt-1">
              {error ? "Erro ao carregar pedidos" : "Você ainda não tem pedidos com este status"}
            </p>
            {error ? <CustomButton variant="primary" className="mt-4" onClick={handleRetry} disabled={isRefetching}>
                {isRefetching ? "Carregando..." : "Tentar novamente"}
              </CustomButton> : <CustomButton variant="primary" className="mt-4" onClick={() => navigate('/marketplace')}>
                Ir para loja
              </CustomButton>}
          </div> : filteredOrders.map(order => {
        // Get order summary data safely
        const orderSummary = getOrderSummary(order);
        return <Card key={order.id} className="overflow-hidden">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">
                          Pedido #{order.id.substring(0, 8)}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1 mt-1">
                        {orderSummary.firstItemName}
                        {orderSummary.additionalItemsCount > 0 && ` + ${orderSummary.additionalItemsCount} ${orderSummary.additionalItemsCount === 1 ? 'item' : 'itens'}`}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        R$ {Number(order.valor_total).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show product image if available */}
                  {orderSummary.hasItems && orderSummary.firstItem && <div className="mt-2 flex items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <ProductImage imagemUrl={orderSummary.firstItem.produto?.imagem_url || getProductImageUrl(orderSummary.firstItem.produto)} productName={orderSummary.firstItemName} size="sm" />
                      </div>
                      <div className="text-xs text-gray-500">
                        {orderSummary.firstItem.quantidade}x {orderSummary.firstItemName.substring(0, 20)}
                        {orderSummary.firstItemName.length > 20 ? '...' : ''}
                      </div>
                    </div>}
                  
                  {/* Debug info for each order */}
                  {debugMode && <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      <p>ID: {order.id}</p>
                      <p>Items: {order.items?.length || 0}</p>
                      <p>Cliente ID: {order.cliente_id}</p>
                      <p>Status: {order.status}</p>
                    </div>}
                </div>
                
                {/* Buttons row - Made more mobile friendly */}
                <div className="bg-gray-50 p-2 flex items-center justify-between gap-2">
                  <div className="flex gap-1 flex-1">
                    <CustomButton variant="outline" size="sm" className="text-xs py-1 px-2 flex-1 flex justify-center" onClick={() => handleTrackOrder(order.id)} icon={<TruckIcon size={14} />}>
                      Acompanhar
                    </CustomButton>
                    <CustomButton variant="outline" size="sm" className="text-xs py-1 px-2 flex-1 flex justify-center" onClick={() => handleReorder(order.id)} icon={<ShoppingBag size={14} />}>
                      Comprar
                    </CustomButton>
                  </div>
                  <CustomButton variant="link" size="sm" className="text-xs mr-0 px-2" onClick={() => navigate(`/profile/orders/${order.id}`)} icon={<ArrowRight size={14} />} iconPosition="right">
                    Detalhes
                  </CustomButton>
                </div>
              </Card>;
      })}
      </div>
    </div>;
};
export default OrdersScreen;