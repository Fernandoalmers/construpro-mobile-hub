
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, TruckIcon, ShoppingBag, ArrowRight, Search } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';

const OrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  // Fetch orders from Supabase using orderService
  const { 
    data: orders = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['userOrders'],
    queryFn: orderService.getOrders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (error) {
    console.error('Error fetching orders:', error);
  }
  
  // Filter orders by status if not "todos"
  const filteredOrders = statusFilter === "todos" 
    ? orders 
    : orders.filter(order => {
        if (statusFilter === "emProcesso") {
          return ["Em Separação", "Confirmado", "Em Trânsito"].includes(order.status);
        }
        return order.status === statusFilter;
      });
      
  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Entregue":
        return "bg-green-100 text-green-800";
      case "Em Trânsito":
        return "bg-blue-100 text-blue-800";
      case "Em Separação":
        return "bg-yellow-100 text-yellow-800";
      case "Confirmado":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const handleTrackOrder = (orderId: string) => {
    toast.info(`Acompanhamento do pedido ${orderId}`);
    // In a real app, this would navigate to a tracking page
  };
  
  const handleReorder = (orderId: string) => {
    // In a real app, this would add items to cart from this order
    toast.success("Itens adicionados ao carrinho");
    navigate('/marketplace');
  };

  const handleRetry = () => {
    toast.info("Tentando carregar pedidos novamente...");
    refetch();
  };

  if (isLoading) {
    return <LoadingState text="Carregando seus pedidos..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header - Sticky header for better mobile experience */}
      <div className="bg-construPro-blue p-4 pt-10 sticky top-0 z-10 shadow-md">
        <div className="flex items-center mb-3">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Pedidos</h1>
        </div>
        
        {/* Tabs - Improved for mobile view */}
        <div className="px-0 -mt-1 -mx-1">
          <Card className="p-1 shadow-none rounded-b-none">
            <Tabs defaultValue="todos" onValueChange={setStatusFilter} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-50 p-0.5 h-auto">
                <TabsTrigger 
                  value="todos" 
                  className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="emProcesso" 
                  className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Em Processo
                </TabsTrigger>
                <TabsTrigger 
                  value="Entregue" 
                  className="flex-1 py-2 px-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Entregues
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>
        </div>
      </div>
      
      {/* Orders List - Improved card design for mobile */}
      <div className="p-4 space-y-3 pb-24">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mt-1">Você ainda não tem pedidos com este status</p>
            {error ? (
              <CustomButton 
                variant="primary" 
                className="mt-4"
                onClick={handleRetry}
              >
                Tentar novamente
              </CustomButton>
            ) : (
              <CustomButton 
                variant="primary" 
                className="mt-4"
                onClick={() => navigate('/marketplace')}
              >
                Ir para loja
              </CustomButton>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            // Get summary data about the order
            const orderItems = order.items || [];
            const firstItemName = orderItems && orderItems.length > 0 
              ? (orderItems[0]?.produto?.nome || 'Produto')
              : 'Pedido';
            
            const additionalItemsCount = (orderItems?.length || 1) - 1;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Pedido #{order.id.substring(0, 8)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1 mt-1">
                        {firstItemName}
                        {additionalItemsCount > 0 && ` + ${additionalItemsCount} ${additionalItemsCount === 1 ? 'item' : 'itens'}`}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {Number(order.valor_total).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Buttons row - Made more mobile friendly */}
                <div className="bg-gray-50 p-2 flex items-center justify-between gap-2">
                  <div className="flex gap-1 flex-1">
                    <CustomButton 
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 px-2 flex-1 flex justify-center"
                      onClick={() => handleTrackOrder(order.id)}
                      icon={<TruckIcon size={14} />}
                    >
                      Acompanhar
                    </CustomButton>
                    <CustomButton 
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 px-2 flex-1 flex justify-center"
                      onClick={() => handleReorder(order.id)}
                      icon={<ShoppingBag size={14} />}
                    >
                      Comprar
                    </CustomButton>
                  </div>
                  <CustomButton
                    variant="link" 
                    size="sm"
                    className="text-xs mr-0 px-2"
                    onClick={() => navigate(`/profile/orders/${order.id}`)}
                    icon={<ArrowRight size={14} />}
                    iconPosition="right"
                  >
                    Detalhes
                  </CustomButton>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersScreen;
