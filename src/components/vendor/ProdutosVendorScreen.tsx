
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVendorOrders, VendorOrder } from '@/services/vendor/orders';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';
import OrderItem from './OrderItem';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

const ProdutosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [profileRoleFixed, setProfileRoleFixed] = useState<boolean | null>(null);
  
  // Check and fix profile role if needed
  useEffect(() => {
    const fixProfileRole = async () => {
      const updated = await ensureVendorProfileRole();
      setProfileRoleFixed(updated);
      if (updated) {
        toast.success('Perfil de vendedor configurado com sucesso');
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      }
    };
    
    fixProfileRole();
  }, [queryClient]);
  
  // Fetch orders with a shorter staleTime to ensure fresher data
  const { 
    data: orders = [], 
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: getVendorOrders,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2
  });
  
  console.log('Orders loaded:', orders?.length || 0);

  // Force refresh whenever the component mounts or profile role is fixed
  useEffect(() => {
    refetch();
  }, [refetch, profileRoleFixed]);
  
  const handleRefresh = () => {
    toast.info('Atualizando lista de pedidos...');
    refetch();
  };
  
  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      (order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || 
      (order.status && order.status.toLowerCase() === filterStatus);
    
    return matchesSearch && matchesStatus;
  });
  
  // Order Status types
  const orderStatuses = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'processando', label: 'Em processamento' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  if (isOrdersLoading) {
    return <LoadingState text="Carregando pedidos..." />;
  }
  
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Pedidos</h1>
        </div>
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4 flex items-start">
            <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-red-700 font-medium">Erro ao carregar pedidos</p>
              <p className="text-red-600 text-sm mt-1">Verifique suas permissões e tente novamente</p>
            </div>
          </div>
          <Button 
            className="px-4 py-2 bg-construPro-blue text-white rounded"
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Pedidos</h1>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
            Atualizar
          </Button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Search and filters */}
        <div className="space-y-4">
          <CustomInput
            placeholder="Buscar por nome do cliente ou código do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch
            className="w-full"
          />
          
          <div className="flex overflow-x-auto gap-2 pb-2">
            <button
              onClick={() => setFilterStatus(null)}
              className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
                filterStatus === null 
                  ? 'bg-construPro-blue text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Todos
            </button>
            
            {orderStatuses.map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value === filterStatus ? null : status.value)}
                className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
                  status.value === filterStatus 
                    ? 'bg-construPro-blue text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Order Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Pedidos Pendentes</p>
            <p className="text-xl font-bold">
              {orders.filter(order => order.status && order.status.toLowerCase() === 'pendente').length}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Pedidos Recentes</p>
            <p className="text-xl font-bold">
              {orders.filter(order => {
                const orderDate = new Date(order.created_at);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                return orderDate > threeDaysAgo;
              }).length}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Total Vendido</p>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(
                orders.reduce((sum, order) => sum + Number(order.valor_total || 0), 0)
              )}
            </p>
          </Card>
        </div>
        
        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Lista de pedidos</h2>
          
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <OrderItem 
                  key={order.id}
                  order={order}
                  onViewDetails={() => navigate(`/vendor/orders/${order.id}`)}
                />
              ))}
            </div>
          ) : (
            <ListEmptyState
              icon={<Search className="h-12 w-12 text-gray-400" />}
              title="Nenhum pedido encontrado"
              description={
                searchTerm || filterStatus 
                  ? "Tente ajustar os filtros de busca" 
                  : "Você ainda não tem nenhum pedido"
              }
              action={
                (searchTerm || filterStatus) ? {
                  label: "Limpar filtros",
                  onClick: () => {
                    setSearchTerm('');
                    setFilterStatus(null);
                  }
                } : {
                  label: "Atualizar dados",
                  onClick: handleRefresh
                }
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutosVendorScreen;
