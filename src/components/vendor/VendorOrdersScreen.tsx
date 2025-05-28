
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import OrdersHeader from './orders/OrdersHeader';
import OrderStats from './orders/OrderStats';
import OrderFilters from './orders/OrderFilters';
import OrdersList from './orders/OrdersList';
import OrdersError from './orders/OrdersError';
import { usePedidosVendor } from '@/hooks/vendor/usePedidosVendor';
import { useOrderFilters, orderStatuses } from '@/hooks/vendor/useOrderFilters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Store, AlertCircle, RefreshCcw, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { VendorOrder } from '@/services/vendor/orders/types';
import type { Pedido } from '@/services/vendor/orders/pedidosService';

// Função para converter Pedido para VendorOrder
const convertPedidoToVendorOrder = (pedido: Pedido): VendorOrder => {
  console.log('🔄 [convertPedidoToVendorOrder] Converting pedido:', {
    id: pedido.id,
    valor_total: pedido.valor_total,
    status: pedido.status,
    cliente: pedido.cliente?.nome,
    itens_count: pedido.itens?.length || 0
  });
  
  return {
    id: pedido.id,
    vendedor_id: pedido.vendedor_id,
    cliente_id: pedido.usuario_id,
    valor_total: pedido.valor_total,
    status: pedido.status,
    forma_pagamento: pedido.forma_pagamento,
    endereco_entrega: pedido.endereco_entrega,
    created_at: pedido.created_at,
    data_criacao: pedido.created_at,
    data_entrega_estimada: pedido.data_entrega_estimada,
    rastreio: undefined, // Set to undefined since it doesn't exist in pedidos table
    cliente: pedido.cliente,
    itens: pedido.itens?.map(item => ({
      id: item.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      total: item.total,
      created_at: item.created_at,
      produto: item.produto
    }))
  };
};

const VendorOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  console.log('🚀 [VendorOrdersScreen] Component mounting/updating - USANDO PEDIDOS HOOK');
  
  // ✅ AGORA USANDO APENAS O HOOK CORRETO: usePedidosVendor
  const { 
    pedidos, 
    isLoading, 
    error, 
    refetch, 
    isRefetching, 
    handleRefresh,
    vendorProfileStatus,
    isMigrating,
    handleMigration
  } = usePedidosVendor();
  
  console.log('📊 [VendorOrdersScreen] HOOK CORRETO - usePedidosVendor data:', {
    pedidosCount: pedidos.length,
    isLoading,
    error: !!error,
    vendorProfileStatus,
    isMigrating,
    isAuthenticated,
    userId: user?.id
  });
  
  // Convert pedidos to VendorOrder format for compatibility
  const orders: VendorOrder[] = React.useMemo(() => {
    console.log('🔄 [VendorOrdersScreen] CONVERSÃO DE DADOS - Converting pedidos to orders format. Input pedidos:', pedidos.length);
    
    if (!pedidos || pedidos.length === 0) {
      console.log('⚠️ [VendorOrdersScreen] CONVERSÃO DE DADOS - No pedidos to convert');
      return [];
    }
    
    const convertedOrders = pedidos.map(convertPedidoToVendorOrder);
    console.log('✅ [VendorOrdersScreen] CONVERSÃO DE DADOS - Converted orders:', {
      input: pedidos.length,
      output: convertedOrders.length,
      firstOrder: convertedOrders[0] ? {
        id: convertedOrders[0].id,
        valor_total: convertedOrders[0].valor_total,
        status: convertedOrders[0].status
      } : null
    });
    
    return convertedOrders;
  }, [pedidos]);
  
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders
  } = useOrderFilters(orders);
  
  console.log('📊 [VendorOrdersScreen] ESTADO FINAL após conversão:', {
    pedidosCount: pedidos?.length || 0,
    ordersCount: orders?.length || 0,
    filteredOrdersCount: filteredOrders?.length || 0,
    isLoading,
    error: !!error,
    vendorProfileStatus,
    errorMessage: error?.message,
    isAuthenticated,
    userId: user?.id
  });

  // Log detailed information about pedidos for debugging
  React.useEffect(() => {
    if (pedidos && pedidos.length > 0) {
      console.log('📋 [VendorOrdersScreen] SUCESSO - Pedidos carregados da tabela pedidos:', {
        totalPedidos: pedidos.length,
        firstPedidoId: pedidos[0]?.id,
        firstPedidoStatus: pedidos[0]?.status,
        firstPedidoTotal: pedidos[0]?.valor_total,
        firstPedidoCustomer: pedidos[0]?.cliente?.nome,
        firstPedidoItems: pedidos[0]?.itens?.length || 0,
        allPedidoIds: pedidos.map(p => p.id)
      });
    } else if (!isLoading && !error) {
      console.log('⚠️ [VendorOrdersScreen] AVISO - Nenhum pedido encontrado na tabela pedidos mas sem erro');
    }
  }, [pedidos, isLoading, error]);

  // Additional debug for orders conversion
  React.useEffect(() => {
    console.log('🔍 [VendorOrdersScreen] ORDERS EFFECT - Orders effect triggered:', {
      ordersLength: orders.length,
      filteredOrdersLength: filteredOrders.length,
      hasSearchTerm: !!searchTerm,
      hasFilterStatus: !!filterStatus
    });
  }, [orders, filteredOrders, searchTerm, filterStatus]);

  // Check authentication first
  if (!isAuthenticated || !user) {
    console.log('🚫 [VendorOrdersScreen] User not authenticated');
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <OrdersHeader 
          onBack={() => navigate('/vendor')} 
          onRefresh={() => {}} 
          isRefetching={false} 
        />
        
        <div className="p-6 flex flex-col items-center justify-center flex-grow">
          <Card className="p-6 max-w-md w-full text-center">
            <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso não autorizado</h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para acessar esta página.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-construPro-blue hover:bg-blue-700 mb-4"
            >
              Fazer Login
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

  // Show vendor profile setup message if profile is not found
  if (vendorProfileStatus === 'not_found') {
    console.log('🚫 [VendorOrdersScreen] Vendor profile not found');
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
    console.log('⏳ [VendorOrdersScreen] Loading state');
    return <LoadingState text="Carregando pedidos do vendedor da tabela pedidos..." />;
  }
  
  if (error) {
    console.error('❌ [VendorOrdersScreen] Erro ao carregar pedidos:', error);
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

  console.log('🎨 [VendorOrdersScreen] RENDERIZAÇÃO PRINCIPAL - Rendering main interface with orders:', orders.length);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <OrdersHeader 
        onBack={() => navigate('/vendor')} 
        onRefresh={handleRefresh} 
        isRefetching={isRefetching} 
      />
      
      <div className="p-6 space-y-6">
        {/* Status da correção */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Sistema Corrigido - Usando usePedidosVendor</h3>
              <p className="text-sm text-green-700 mt-1">
                Agora usando exclusivamente a tabela pedidos com o hook correto. 
                Usuário: {user.email} | Pedidos: {pedidos.length} | Orders convertidos: {orders.length}
              </p>
            </div>
          </div>
        </Card>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Debug Info - Hook Correto Ativo</h3>
                <div className="text-sm text-blue-700 mt-1 font-mono">
                  <p>✅ Hook: usePedidosVendor (CORRETO)</p>
                  <p>Pedidos raw: {pedidos.length}</p>
                  <p>Orders converted: {orders.length}</p>
                  <p>Filtered orders: {filteredOrders.length}</p>
                  <p>Vendor status: {vendorProfileStatus}</p>
                  <p>Loading: {isLoading ? 'true' : 'false'}</p>
                  <p>Error: {error ? 'true' : 'false'}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Migração de dados se necessário */}
        {pedidos.length === 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-800">Migração de Dados</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Se você não está vendo seus pedidos, execute a migração para transferir 
                  os dados da tabela orders para a nova tabela pedidos.
                </p>
                <Button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isMigrating ? (
                    <>
                      <RefreshCcw size={16} className="mr-1 animate-spin" />
                      Migrando dados...
                    </>
                  ) : (
                    <>
                      <Database size={16} className="mr-1" />
                      Migrar dados existentes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

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
          <h2 className="font-bold text-lg">Lista de pedidos da tabela pedidos ({orders.length})</h2>
          
          {orders.length === 0 && !isRefetching ? (
            <div className="rounded-lg border p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não foram encontrados pedidos na tabela pedidos para este vendedor.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isMigrating ? (
                    <>
                      <RefreshCcw size={16} className="mr-1 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <Database size={16} className="mr-1" />
                      Migrar dados
                    </>
                  )}
                </Button>
                <Button onClick={handleRefresh} variant="outline" className="mt-2">
                  <RefreshCcw size={16} className="mr-1" />
                  Atualizar
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

export default VendorOrdersScreen;
