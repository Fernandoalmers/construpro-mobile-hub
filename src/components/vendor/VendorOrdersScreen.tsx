
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/card';
import { Store, AlertCircle, RefreshCcw, Bug, RotateCcw, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { updateVendorStatus } from '@/services/vendor/orders/utils/diagnosticUtils';
import DebugOrdersView from './orders/DebugOrdersView';

const VendorOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Use the custom hooks for data and filtering
  const { 
    orders, 
    isLoading, 
    error, 
    refetch, 
    isRefetching, 
    handleRefresh,
    vendorProfileStatus,
    diagnosticResults,
    isFixingVendorStatus,
    debugMode,
    debugData,
    toggleDebugMode,
    forceRefresh
  } = useVendorOrders();
  
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders
  } = useOrderFilters(orders);
  
  // Show vendor profile setup message if profile is not found
  if (vendorProfileStatus === 'not_found') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <OrdersHeader 
          onBack={() => navigate('/profile')} 
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
              onClick={() => {
                toast.info('Alternando para modo consumidor');
                navigate('/profile');
              }}
            >
              Voltar para Perfil
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || isFixingVendorStatus) {
    return <LoadingState text={isFixingVendorStatus ? "Configurando perfil de vendedor..." : "Carregando pedidos..."} />;
  }
  
  if (error) {
    console.error('Error fetching orders:', error);
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

  // Check if we need to fix vendor status
  const vendorStatus = diagnosticResults?.vendorProfile?.status || 
                      diagnosticResults?.diagnosticInfo?.vendorStatus;
  const showVendorStatusFix = vendorStatus === 'pendente';
  
  const fixVendorStatus = async () => {
    const vendorId = diagnosticResults?.vendorProfile?.id;
    if (!vendorId) {
      toast.error("ID do vendedor não encontrado");
      return;
    }
    
    toast.loading("Atualizando status do vendedor...");
    
    try {
      const result = await updateVendorStatus(vendorId, 'ativo');
      
      if (result.success) {
        toast.success("Status do vendedor atualizado com sucesso");
        // Refresh data
        setTimeout(() => {
          refetch();
        }, 1000);
      } else {
        toast.error("Erro ao atualizar status do vendedor");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status do vendedor");
      console.error("Error updating vendor status:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <OrdersHeader 
        onBack={() => navigate('/vendor')} 
        onRefresh={handleRefresh} 
        isRefetching={isRefetching} 
      />
      
      <div className="p-6 space-y-6">
        {/* Customer Registration Info Alert */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Registro automático de clientes</h3>
              <p className="text-sm text-blue-700 mt-1">
                Quando um cliente faz uma compra, ele é automaticamente registrado na sua lista de clientes.
                Você também pode importar clientes de pedidos existentes na página de clientes.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 bg-white hover:bg-blue-100 border-blue-200"
                onClick={() => navigate('/vendor/customers')}
              >
                Ver lista de clientes
              </Button>
            </div>
          </div>
        </Card>

        {/* Debug Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleDebugMode}
              className={`flex items-center gap-1 ${debugMode ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <Bug size={16} className={debugMode ? 'text-blue-500' : ''} />
              {debugMode ? 'Desativar Modo Debug' : 'Ativar Modo Debug'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              className="flex items-center gap-1"
            >
              <RotateCcw size={16} />
              Forçar Atualização
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <OrderFilters 
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          orderStatuses={orderStatuses}
        />
        
        {/* Debug View - only shown when debug mode is active */}
        {debugMode && debugData && (
          <DebugOrdersView debugData={debugData} />
        )}
        
        {/* Order Stats */}
        <OrderStats orders={orders} />
        
        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Lista de pedidos</h2>
          
          {showVendorStatusFix && (
            <Card className="p-4 mb-4 border-yellow-300 bg-yellow-50">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">Status do vendedor pendente</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    O status do seu perfil de vendedor está como "pendente", o que pode impedir a visualização dos pedidos.
                  </p>
                </div>
                <Button 
                  onClick={fixVendorStatus}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
                  size="sm"
                >
                  <RefreshCcw size={16} />
                  Corrigir status
                </Button>
              </div>
            </Card>
          )}
          
          {orders.length === 0 && !isRefetching ? (
            <div className="rounded-lg border p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não encontramos pedidos vinculados à sua loja. Isto pode ocorrer por alguns motivos:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mb-4 text-left">
                <li>Sua loja ainda não recebeu pedidos</li>
                <li>Os produtos cadastrados não foram associados corretamente</li>
                {showVendorStatusFix && (
                  <li className="font-medium text-yellow-700">
                    Seu perfil de vendedor está com status "pendente"
                  </li>
                )}
              </ul>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={handleRefresh} className="mt-2">
                  Tentar novamente
                </Button>
                {showVendorStatusFix && (
                  <Button 
                    onClick={fixVendorStatus}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                  >
                    Corrigir status do vendedor
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={forceRefresh} 
                  className="mt-2 flex items-center gap-1"
                >
                  <RotateCcw size={16} />
                  Forçar Atualização
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
