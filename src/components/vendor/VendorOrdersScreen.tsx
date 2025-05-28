
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
  
  // Use the new pedidos hook
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
  
  // Convert pedidos to VendorOrder format for compatibility
  const orders: VendorOrder[] = React.useMemo(() => {
    return pedidos.map(convertPedidoToVendorOrder);
  }, [pedidos]);
  
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders
  } = useOrderFilters(orders);
  
  console.log('📊 [VendorOrdersScreen] Estado atual:', {
    pedidosCount: pedidos?.length || 0,
    isLoading,
    error: !!error,
    vendorProfileStatus,
    filteredOrdersCount: filteredOrders?.length || 0,
    errorMessage: error?.message,
    isAuthenticated,
    userId: user?.id
  });

  // Log detailed information about pedidos for debugging
  React.useEffect(() => {
    if (pedidos && pedidos.length > 0) {
      console.log('📋 [VendorOrdersScreen] Pedidos carregados com sucesso da tabela pedidos:', {
        totalPedidos: pedidos.length,
        firstPedidoId: pedidos[0]?.id,
        firstPedidoStatus: pedidos[0]?.status,
        firstPedidoTotal: pedidos[0]?.valor_total,
        firstPedidoCustomer: pedidos[0]?.cliente?.nome,
        firstPedidoItems: pedidos[0]?.itens?.length || 0
      });
    } else if (!isLoading && !error) {
      console.log('⚠️ [VendorOrdersScreen] Nenhum pedido encontrado na tabela pedidos mas sem erro');
    }
  }, [pedidos, isLoading, error]);

  // Check authentication first
  if (!isAuthenticated || !user) {
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
    return <LoadingState text="Carregando pedidos do vendedor..." />;
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <OrdersHeader 
        onBack={() => navigate('/vendor')} 
        onRefresh={handleRefresh} 
        isRefetching={isRefetching} 
      />
      
      <div className="p-6 space-y-6">
        {/* Sincronização implementada com sucesso */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Sincronização Automática Implementada</h3>
              <p className="text-sm text-green-700 mt-1">
                Sistema agora usa a tabela pedidos dedicada para vendedores. Os dados são sincronizados automaticamente 
                da tabela orders. Usuário autenticado: {user.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Migração de dados se necessário */}
        {pedidos.length === 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-800">Migração de Dados</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Se você não está vendo seus pedidos, pode ser necessário migrar os dados existentes 
                  da tabela orders para a nova tabela pedidos.
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
          <h2 className="font-bold text-lg">Lista de pedidos</h2>
          
          {pedidos.length === 0 && !isRefetching ? (
            <div className="rounded-lg border p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não foram encontrados pedidos na tabela pedidos. Possíveis motivos:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mb-4 text-left">
                <li>Sua loja ainda não recebeu pedidos</li>
                <li>Os dados ainda não foram migrados da tabela orders</li>
                <li>É necessário executar a migração de dados</li>
                <li>Produtos não estão associados ao seu perfil de vendedor</li>
              </ul>
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

export default VendorOrdersScreen;
