
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, Filter, RefreshCw } from 'lucide-react';
import { fetchAdminOrders } from '@/services/admin/orders';
import { getOrderStatusBadgeColor } from '@/services/admin/orders/orderUtils';
import OrderDetailsModal from './OrderDetailsModal';
import { AdminOrder } from '@/services/admin/orders/types';
import { getOrderDetails } from '@/services/admin/orders/orderDetails';

const OrdersManagementScreen: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Fetch orders with pagination
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['adminOrders', page, statusFilter],
    queryFn: () => fetchAdminOrders({ 
      page, 
      limit: 25, 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
    staleTime: 30000, // 30 seconds
  });

  const handleViewOrder = async (order: AdminOrder) => {
    console.log(`[OrdersManagement] Opening order details for: ${order.id}`);

    try {
      // Fetch the complete order details using the FULL ID
      const orderDetails = await getOrderDetails(order.id);
      
      if (orderDetails) {
        console.log(`[OrdersManagement] Order details loaded successfully`);
        setSelectedOrder(orderDetails);
      } else {
        console.error(`[OrdersManagement] Failed to load order details for ID: ${order.id}`);
        // Fallback to the basic order data
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error(`[OrdersManagement] Error loading order details:`, error);
      // Fallback to the basic order data
      setSelectedOrder(order);
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders based on search term
  const filteredOrders = ordersData?.orders?.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.cliente_nome?.toLowerCase().includes(searchLower) ||
      order.loja_nome?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Pedidos</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por ID, cliente ou loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
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
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando pedidos...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>{order.cliente_nome || 'Cliente não identificado'}</TableCell>
                    <TableCell>{order.loja_nome || 'Loja não identificada'}</TableCell>
                    <TableCell>{formatCurrency(order.valor_total)}</TableCell>
                    <TableCell>
                      <Badge className={getOrderStatusBadgeColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.data_criacao || order.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewOrder(order)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {ordersData && ordersData.totalCount > 25 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {filteredOrders.length} de {ordersData.totalCount} pedidos
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={!ordersData.hasMore}
                variant="outline"
                size="sm"
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default OrdersManagementScreen;
