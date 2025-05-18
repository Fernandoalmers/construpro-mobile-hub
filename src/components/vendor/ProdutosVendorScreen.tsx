
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

const ProdutosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Use the custom hooks for data and filtering
  const { 
    orders, 
    isLoading, 
    error, 
    refetch, 
    isRefetching, 
    handleRefresh 
  } = useVendorOrders();
  
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredOrders
  } = useOrderFilters(orders);
  
  console.log('Orders loaded:', orders?.length || 0);

  if (isLoading) {
    return <LoadingState text="Carregando pedidos..." />;
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
        </div>
      </div>
    </div>
  );
};

export default ProdutosVendorScreen;
