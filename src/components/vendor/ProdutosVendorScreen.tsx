
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import OrdersHeader from './orders/OrdersHeader';
import OrderStats from './orders/OrderStats';
import OrderFilters from './orders/OrderFilters';
import OrdersList from './orders/OrdersList';
import OrdersError from './orders/OrdersError';
import { useVendorOrders } from '@/hooks/vendor/useVendorOrders';
import { useOrderFilters, orderStatuses } from '@/hooks/vendor/useOrderFilters';
import { Button } from '@/components/ui/button';
import { Store, AlertCircle, RefreshCcw, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ProdutosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Use the custom hooks for data and filtering
  const { 
    orders, 
    isLoading, 
    error, 
    refetch, 
    isRefetching, 
    handleRefresh,
    vendorProfileStatus
  } = useVendorOrders();
  
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders
  } = useOrderFilters(orders);
  
  console.log('📊 [ProdutosVendorScreen] Current state:', {
    ordersCount: orders?.length || 0,
    isLoading,
    error: !!error,
    vendorProfileStatus,
    filteredOrdersCount: filteredOrders?.length || 0,
    errorMessage: error?.message
  });

  // Log detailed information about orders for debugging
  React.useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('📋 [ProdutosVendorScreen] Orders loaded successfully from orders table:', {
        totalOrders: orders.length,
        firstOrderId: orders[0]?.id,
        firstOrderStatus: orders[0]?.status,
        firstOrderTotal: orders[0]?.valor_total,
        firstOrderCustomer: orders[0]?.cliente?.nome,
        firstOrderItems: orders[0]?.itens?.length || 0
      });
    } else if (!isLoading && !error) {
      console.log('⚠️ [ProdutosVendorScreen] No orders found in orders table but no error occurred');
    }
  }, [orders, isLoading, error]);

  // Show vendor profile setup message if profile is not found
  if (vendorProfileStatus === 'not_found') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <OrdersHeader 
          onBack={() => navigate('/vendor')} 
          onRefresh={() => {}} 
          isRefetching={false} 
        />
        
        <div className="p-6 flex flex-col items-center justify-center flex-grow">
          <Card className="p-6 max-w-md w-full text-center">
            <Store size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Configure seu perfil de vendedor</h2>
            <p className="text-gray-600 mb-6">
              Você precisa configurar seu perfil de vendedor para poder acessar e gerenciar seus pedidos.
            </p>
            <Button 
              onClick={() => navigate('/auth/vendor-profile')}
              className="w-full bg-construPro-blue hover:bg-blue-700 mb-4"
            >
              Configurar Perfil
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate('/vendor')}
            >
              Voltar para Portal do Vendedor
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState text="Carregando pedidos da tabela orders..." />;
  }
  
  if (error) {
    console.error('❌ [ProdutosVendorScreen] Error loading orders from orders table:', error);
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <OrdersHeader 
          onBack={() => navigate('/vendor')} 
          onRefresh={refetch} 
          isRefetching={isRefetching} 
        />
        <OrdersError onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <OrdersHeader 
        onBack={() => navigate('/vendor')} 
        onRefresh={handleRefresh} 
        isRefetching={isRefetching} 
      />
      
      <div className="p-6 space-y-6">
        {/* Success message about using orders table */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Sistema atualizado</h3>
              <p className="text-sm text-green-700 mt-1">
                Agora buscando pedidos diretamente da tabela principal 'orders'. 
                Todos os pedidos dos seus clientes devem aparecer aqui.
              </p>
            </div>
          </div>
        </Card>

        {/* Search and filters */}
        <OrderFilters 
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          orderStatuses={orderStatuses}
        />
        
        {/* Order Stats */}
        <OrderStats orders={orders} />
        
        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Lista de pedidos</h2>
          
          {orders.length === 0 && !isRefetching ? (
            <div className="rounded-lg border p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado na tabela orders</h3>
              <p className="text-gray-500 mb-4">
                Não encontramos pedidos na tabela principal 'orders'. Possíveis motivos:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mb-4 text-left">
                <li>Sua loja ainda não recebeu pedidos</li>
                <li>Os produtos não estão sendo exibidos no marketplace</li>
                <li>Pedidos podem estar em outra tabela (pedidos)</li>
                <li>Problema de sincronização entre tabelas</li>
              </ul>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRefresh} className="mt-2">
                  <RefreshCcw size={16} className="mr-1" />
                  Atualizar pedidos
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/vendor/customers')}
                  className="mt-2"
                >
                  Ver clientes
                </Button>
              </div>
            </div>
          ) : (
            <OrdersList 
              orders={filteredOrders}
              onViewDetails={(orderId) => navigate(`/vendor/orders/${orderId}`)}
              hasFilters={!!(searchTerm || filterStatus)}
              onClearFilters={() => {
                setSearchTerm('');
                setFilterStatus(null);
              }}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutosVendorScreen;
