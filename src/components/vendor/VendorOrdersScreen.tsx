
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Search, Filter, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePedidosVendor } from '@/hooks/vendor/usePedidosVendor';
import LoadingState from '../common/LoadingState';
import { toast } from '@/components/ui/sonner';

const VendorOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
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
    checkSyncIntegrity
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
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case "entregue":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "enviado":
        return { color: "bg-blue-100 text-blue-800", icon: Package };
      case "processando":
        return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "confirmado":
        return { color: "bg-purple-100 text-purple-800", icon: CheckCircle };
      case "pendente":
        return { color: "bg-orange-100 text-orange-800", icon: Clock };
      case "cancelado":
        return { color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Package };
    }
  };

  // Get sync status badge
  const getSyncStatusBadge = () => {
    if (!syncStatus) return null;
    
    switch(syncStatus.sync_status) {
      case 'SYNC_OK':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Shield size={12} className="mr-1" />
            Sincronização OK
          </Badge>
        );
      case 'SYNC_WARNING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle size={12} className="mr-1" />
            {syncStatus.missing_pedidos} pedidos não sincronizados
          </Badge>
        );
      case 'SYNC_CRITICAL':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle size={12} className="mr-1" />
            CRÍTICO: {syncStatus.missing_pedidos} pedidos perdidos
          </Badge>
        );
      default:
        return null;
    }
  };

  // Show loading state while checking vendor profile
  if (vendorProfileStatus === 'checking') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
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
        <div className="bg-white p-4 flex items-center shadow-sm">
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
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate('/vendor')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Meus Pedidos</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkSyncIntegrity}
            disabled={isCheckingSync}
          >
            <Shield size={16} className={isCheckingSync ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
      
      {/* Sync Status */}
      {syncStatus && (
        <div className="bg-white p-3 border-b">
          <div className="flex items-center justify-between">
            {getSyncStatusBadge()}
            <span className="text-xs text-gray-500">
              Última verificação: {new Date(syncStatus.last_check).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 space-y-3 border-b">
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
      
      <div className="p-6 space-y-4">
        {/* Migration Button - show if sync issues or no orders found */}
        {(pedidos?.length === 0 || (syncStatus && syncStatus.missing_pedidos > 0)) && !isLoading && (
          <Card className="p-4 text-center">
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
            <Button 
              onClick={handleMigration}
              disabled={isMigrating}
              variant="outline"
              size="sm"
            >
              {isMigrating ? 'Sincronizando...' : 'Sincronizar pedidos'}
            </Button>
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
        
        {/* Orders List */}
        {!isLoading && !error && filteredOrders.length === 0 && pedidos?.length > 0 && (
          <Card className="p-6 text-center">
            <Package className="mx-auto text-gray-400 mb-3" size={40} />
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
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/vendor/orders/${pedido.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">Pedido #{pedido.id.substring(0, 8)}</h3>
                  <p className="text-sm text-gray-500">
                    {pedido.cliente?.nome || 'Cliente não identificado'}
                  </p>
                </div>
                <Badge className={statusInfo.color}>
                  <StatusIcon size={12} className="mr-1" />
                  {pedido.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {formatDate(pedido.created_at)}
                </span>
                <span className="font-medium">
                  R$ {Number(pedido.valor_total).toFixed(2)}
                </span>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {pedido.itens?.length || 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default VendorOrdersScreen;
