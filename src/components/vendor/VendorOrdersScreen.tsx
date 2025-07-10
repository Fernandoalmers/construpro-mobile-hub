
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Search, Filter, RefreshCw, Zap, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePedidosVendor } from '@/hooks/vendor/usePedidosVendor';
import { useOrderRealtimeSync } from '@/hooks/useOrderRealtimeSync';
import LoadingState from '../common/LoadingState';
import SyncStatusIndicator from './orders/SyncStatusIndicator';

const VendorOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Setup enhanced real-time updates for all vendor orders
  useOrderRealtimeSync({ mode: 'vendor' });
  const { 
    pedidos, 
    isLoading, 
    error, 
    handleRefresh, 
    vendorProfileStatus,
    isMigrating,
    handleMigration,
    syncStatus,
    isCheckingSync,
    checkSyncIntegrity,
    forceSyncOrders
  } = usePedidosVendor();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Filter orders based on search and status
  const filteredOrders = pedidos?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  // Format date with time since creation
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}min atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  };
  
  // Get status badge with improved colors and icons
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case "entregue":
        return { 
          color: "bg-emerald-100 text-emerald-800 border-emerald-200", 
          icon: Package,
          textColor: "text-emerald-700"
        };
      case "enviado":
        return { 
          color: "bg-blue-100 text-blue-800 border-blue-200", 
          icon: TrendingUp,
          textColor: "text-blue-700"
        };
      case "processando":
        return { 
          color: "bg-amber-100 text-amber-800 border-amber-200", 
          icon: Clock,
          textColor: "text-amber-700"
        };
      case "confirmado":
        return { 
          color: "bg-purple-100 text-purple-800 border-purple-200", 
          icon: Package,
          textColor: "text-purple-700"
        };
      case "pendente":
        return { 
          color: "bg-orange-100 text-orange-800 border-orange-200", 
          icon: Clock,
          textColor: "text-orange-700"
        };
      case "cancelado":
        return { 
          color: "bg-red-100 text-red-800 border-red-200", 
          icon: Package,
          textColor: "text-red-700"
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-800 border-gray-200", 
          icon: Package,
          textColor: "text-gray-700"
        };
    }
  };

  // Show loading state while checking vendor profile
  if (vendorProfileStatus === 'checking') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm border-b">
          <button onClick={() => navigate('/vendor')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Pedidos</h1>
        </div>
        <div className="p-6">
          <LoadingState text="Verificando perfil do vendedor..." />
        </div>
      </div>
    );
  }

  // Show error if no vendor profile
  if (vendorProfileStatus === 'not_found') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm border-b">
          <button onClick={() => navigate('/vendor')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Pedidos</h1>
        </div>
        <div className="text-center p-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Configure seu perfil primeiro</h3>
          <p className="text-gray-500 mt-1">Você precisa configurar seu perfil de vendedor para visualizar pedidos</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/vendor')}
          >
            Voltar ao painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/vendor')} className="mr-4">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Meus Pedidos</h1>
              {pedidos && pedidos.length > 0 && (
                <p className="text-sm text-gray-500">{filteredOrders.length} de {pedidos.length} pedidos</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkSyncIntegrity}
              disabled={isCheckingSync}
              className="flex items-center gap-1"
            >
              <RefreshCw size={16} className={isCheckingSync ? 'animate-spin' : ''} />
              Verificar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Sync Status - Improved layout */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <SyncStatusIndicator 
              syncStatus={syncStatus} 
              isChecking={isCheckingSync} 
            />
            {syncStatus && (
              <span className="text-xs text-gray-500">
                Última verificação: {new Date(syncStatus.last_check).toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Filters */}
      <div className="bg-white border-b">
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por ID ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Sync Actions - Improved presentation */}
        {(pedidos?.length === 0 || (syncStatus && syncStatus.missing_pedidos > 0)) && !isLoading && (
          <Card className="p-6 text-center border-dashed">
            <Package className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="font-medium mb-2">
              {syncStatus && syncStatus.missing_pedidos > 0 
                ? `${syncStatus.missing_pedidos} pedidos não sincronizados`
                : 'Nenhum pedido encontrado'
              }
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {syncStatus && syncStatus.missing_pedidos > 0
                ? 'Execute a sincronização para corrigir os pedidos perdidos.'
                : 'Se você tinha pedidos no sistema, execute a sincronização para vê-los aqui.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                variant="outline"
                size="sm"
              >
                {isMigrating ? 'Sincronizando...' : 'Sincronizar Pedidos'}
              </Button>
              <Button 
                onClick={forceSyncOrders}
                disabled={isMigrating}
                variant="outline"
                size="sm"
              >
                <Zap size={16} className="mr-1" />
                Forçar Sincronização
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <LoadingState text="Carregando pedidos..." />
        )}
        
        {/* Error State */}
        {error && (
          <Card className="p-6 text-center">
            <Package className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Erro ao carregar pedidos</h3>
            <p className="text-gray-500 mt-1">Tente novamente em alguns instantes</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </Card>
        )}
        
        {/* Orders List - Enhanced cards */}
        {!isLoading && !error && filteredOrders.length === 0 && pedidos?.length > 0 && (
          <Card className="p-6 text-center">
            <Search className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mt-1">Tente ajustar os filtros de busca</p>
          </Card>
        )}
        
        {filteredOrders.map((pedido) => {
          const statusInfo = getStatusBadge(pedido.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card 
              key={pedido.id} 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:shadow-md border-l-4 border-l-transparent hover:border-l-blue-500"
              onClick={() => navigate(`/vendor/orders/${pedido.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">#{pedido.id.substring(0, 8).toUpperCase()}</h3>
                    <Badge className={`${statusInfo.color} border text-xs`}>
                      <StatusIcon size={12} className="mr-1" />
                      {pedido.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {pedido.cliente?.nome || 'Cliente não identificado'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    R$ {Number(pedido.valor_total).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(pedido.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm border-t pt-3 mt-3">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    <Package size={14} className="inline mr-1" />
                    {pedido.itens?.length || 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
                  </span>
                  {pedido.forma_pagamento && (
                    <span className="text-gray-600 capitalize">
                      {pedido.forma_pagamento.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className={`text-xs font-medium ${statusInfo.textColor}`}>
                  Ver detalhes →
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default VendorOrdersScreen;
