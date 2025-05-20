import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import OrdersHeader from './orders/OrdersHeader';
import OrderStats from './orders/OrderStats';
import OrderFilters from './orders/OrderFilters';
import OrdersList from './orders/OrdersList';
import OrdersError from './orders/OrdersError';
import DebugOrdersView from './orders/DebugOrdersView';
import { useVendorOrders } from '@/hooks/vendor/useVendorOrders';
import { useOrderFilters, orderStatuses } from '@/hooks/vendor/useOrderFilters';
import { toast } from '@/components/ui/sonner';

// Import our new components
import DiagnosticActions from './orders/DiagnosticActions';
import CustomerRegistrationInfo from './orders/CustomerRegistrationInfo';
import DebugControls from './orders/DebugControls';
import VendorStatusAlert from './orders/VendorStatusAlert';
import EmptyOrdersState from './orders/EmptyOrdersState';
import ProfileSetupMessage from './orders/ProfileSetupMessage';

// Import necessary services
import { updateVendorStatus } from '@/services/vendor/orders/utils/diagnosticUtils';
import { migrateCustomersFromOrders } from '@/services/vendorCustomersService';
import { runOrdersMigration } from '@/services/vendor/utils/orderMigration';

const VendorOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [isMigratingOrders, setIsMigratingOrders] = React.useState(false);
  
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

  // Check if we need to fix vendor status
  const vendorStatus = diagnosticResults?.vendorProfile?.status || 
                      diagnosticResults?.diagnosticInfo?.vendorStatus;
  const showVendorStatusFix = vendorStatus === 'pendente';
  const vendorId = diagnosticResults?.vendorProfile?.id;

  // Fix vendor status handler
  const fixVendorStatus = () => {
    if (!vendorId) {
      toast.error("ID do vendedor não encontrado");
      return;
    }
    
    toast.loading("Atualizando status do vendedor...");
    
    updateVendorStatus(vendorId, 'ativo')
      .then(result => {
        if (result.success) {
          toast.success("Status do vendedor atualizado com sucesso");
          // Refresh data
          setTimeout(() => {
            refetch();
          }, 1000);
        } else {
          toast.error("Erro ao atualizar status do vendedor");
        }
      })
      .catch(error => {
        toast.error("Erro ao atualizar status do vendedor");
        console.error("Error updating vendor status:", error);
      });
  };

  // Show vendor profile setup message if profile is not found
  if (vendorProfileStatus === 'not_found') {
    return <ProfileSetupMessage onBack={() => navigate('/profile')} />;
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <OrdersHeader 
        onBack={() => navigate('/vendor')} 
        onRefresh={handleRefresh} 
        isRefetching={isRefetching} 
      />
      
      <div className="p-6 space-y-6">
        {/* Diagnostic Actions - Enhanced migration card */}
        <DiagnosticActions 
          showVendorStatusFix={showVendorStatusFix}
          vendorId={vendorId}
          onRefresh={forceRefresh}
        />

        {/* Customer Registration Info Alert */}
        <CustomerRegistrationInfo />

        {/* Debug Controls */}
        <DebugControls 
          debugMode={debugMode}
          toggleDebugMode={toggleDebugMode}
          forceRefresh={forceRefresh}
        />
        
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
            <VendorStatusAlert onFixVendorStatus={fixVendorStatus} />
          )}
          
          {orders.length === 0 && !isRefetching ? (
            <EmptyOrdersState 
              onRefresh={handleRefresh}
              onMigrateOrders={() => {
                setIsMigratingOrders(true);
                runOrdersMigration()
                  .then(result => {
                    if (result.success) {
                      toast.success(result.message || "Migração de pedidos concluída com sucesso!");
                      setTimeout(() => forceRefresh(), 1000);
                    } else {
                      toast.error(result.message || "Erro na migração de pedidos");
                    }
                  })
                  .catch(error => {
                    console.error("Error migrating orders:", error);
                    toast.error("Erro ao migrar pedidos");
                  })
                  .finally(() => setIsMigratingOrders(false));
              }}
              onMigrateCustomers={() => {
                setIsMigrating(true);
                migrateCustomersFromOrders()
                  .then(result => {
                    if (result) {
                      toast.success("Clientes migrados com sucesso!");
                      setTimeout(() => navigate('/vendor/customers'), 1500);
                    } else {
                      toast.error("Falha ao migrar clientes. Verifique os logs para mais detalhes.");
                    }
                  })
                  .catch(error => {
                    console.error("Error running migration:", error);
                    toast.error("Erro ao migrar clientes.");
                  })
                  .finally(() => setIsMigrating(false));
              }}
              onForceRefresh={forceRefresh}
              isMigratingOrders={isMigratingOrders}
              isMigratingCustomers={isMigrating}
              showVendorStatusFix={showVendorStatusFix}
              onFixVendorStatus={fixVendorStatus}
            />
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
