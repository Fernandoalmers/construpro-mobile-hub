
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
    error 
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

  if (isLoading) {
    return <LoadingState text="Carregando seus pedidos..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Pedidos</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 -mt-6">
        <Card className="p-2">
          <Tabs defaultValue="todos" onValueChange={setStatusFilter}>
            <TabsList className="w-full bg-gray-100">
              <TabsTrigger value="todos" className="flex-1">Todos</TabsTrigger>
              <TabsTrigger value="emProcesso" className="flex-1">Em Processo</TabsTrigger>
              <TabsTrigger value="Entregue" className="flex-1">Entregues</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>
      
      {/* Orders List */}
      <div className="p-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mt-1">Você ainda não tem pedidos com este status</p>
            <CustomButton 
              variant="primary" 
              className="mt-4"
              onClick={() => navigate('/marketplace')}
            >
              Ir para loja
            </CustomButton>
          </div>
        ) : (
          filteredOrders.map((order) => {
            // Get summary data about the order
            const firstItemName = order.order_items && order.order_items.length > 0 
              ? (order.order_items[0]?.produtos?.nome || 'Produto')
              : 'Pedido';
            
            const additionalItemsCount = (order.order_items?.length || 1) - 1;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm text-gray-500">Pedido #{order.id.substring(0, 8)}</span>
                      <h3 className="font-medium">
                        {firstItemName}
                        {additionalItemsCount > 0 && ` + ${additionalItemsCount} ${additionalItemsCount === 1 ? 'item' : 'itens'}`}
                      </h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    <div>R$ {Number(order.valor_total).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <CustomButton 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleTrackOrder(order.id)}
                      icon={<TruckIcon size={16} />}
                    >
                      Acompanhar
                    </CustomButton>
                    <CustomButton 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReorder(order.id)}
                      icon={<ShoppingBag size={16} />}
                    >
                      Comprar novamente
                    </CustomButton>
                  </div>
                  <CustomButton
                    variant="link" 
                    size="sm"
                    onClick={() => navigate(`/profile/orders/${order.id}`)}
                    icon={<ArrowRight size={16} />}
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
