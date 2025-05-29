
import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, FileText, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { fetchAdminOrders, getOrderDetails, updateOrderStatus, updateTrackingCode, getOrderStatusBadgeColor } from '@/services/adminOrdersService';
import { AdminOrder, FetchOrdersResult } from '@/services/admin/orders/types';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import OrderDetailsModal from './OrderDetailsModal';

const OrdersManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 25;
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    loadOrders();
  }, [isAdmin, isAdminLoading, currentPage, statusFilter]);
  
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result: FetchOrdersResult = await fetchAdminOrders({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter
      });
      
      setOrders(result.orders);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      
      console.log(`[OrdersManagement] Loaded ${result.orders.length} orders (page ${currentPage})`);
    } catch (err) {
      console.error('[OrdersManagement] Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter orders based on search (client-side for current page)
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      !searchTerm || 
      order.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.loja_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Status do pedido atualizado para: ${newStatus}`);
    } catch (err) {
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  const handleAddTracking = async (orderId: string) => {
    const trackingCode = prompt('Digite o código de rastreio:');
    if (trackingCode) {
      try {
        await updateTrackingCode(orderId, trackingCode);
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, rastreio: trackingCode } : order
          )
        );
        toast.success('Código de rastreio adicionado com sucesso');
      } catch (err) {
        toast.error('Erro ao adicionar código de rastreio');
      }
    }
  };
  
  const handleViewDetails = async (order: AdminOrder) => {
    try {
      setLoadingOrderDetails(true);
      setSelectedOrder(order);
      setIsViewingDetails(true);
      
      // Fetch complete order details if items are not loaded
      if (!order.items || order.items.length === 0) {
        const detailedOrder = await getOrderDetails(order.id);
        if (detailedOrder) {
          setSelectedOrder(detailedOrder);
          
          // Also update the order in the list
          setOrders(prevOrders =>
            prevOrders.map(o => o.id === detailedOrder.id ? detailedOrder : o)
          );
        }
      }
    } catch (err) {
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Pedidos">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Pedidos">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este módulo."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout currentSection="Pedidos">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Pedidos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os pedidos realizados na plataforma ({totalCount} pedidos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('pendente')}
                size="sm"
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'processando' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('processando')}
                size="sm"
              >
                Processando
              </Button>
              <Button
                variant={statusFilter === 'enviado' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('enviado')}
                size="sm"
              >
                Enviados
              </Button>
              <Button
                variant={statusFilter === 'entregue' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('entregue')}
                size="sm"
              >
                Entregues
              </Button>
              <Button
                variant={statusFilter === 'cancelado' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('cancelado')}
                size="sm"
              >
                Cancelados
              </Button>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <LoadingState text="Carregando pedidos..." />
          )}
          
          {/* Error State */}
          {error && !isLoading && (
            <ErrorState title="Erro" message={error} onRetry={loadOrders} />
          )}
          
          {/* Orders Table */}
          {!isLoading && !error && (
            <>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              ) : (
                <>
                  {/* Results info */}
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Mostrando {startItem} - {endItem} de {totalCount} pedidos
                    </p>
                    <p className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </p>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Loja</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map(order => (
                          <TableRow 
                            key={order.id} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleViewDetails(order)}
                          >
                            <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                            <TableCell>{order.cliente_nome}</TableCell>
                            <TableCell>{order.loja_nome}</TableCell>
                            <TableCell>{formatCurrency(order.valor_total)}</TableCell>
                            <TableCell>{order.forma_pagamento}</TableCell>
                            <TableCell>
                              <Badge className={getOrderStatusBadgeColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(order.data_criacao || order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(order);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'processando');
                                  }}
                                  disabled={['entregue', 'cancelado'].includes(order.status)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddTracking(order.id);
                                  }}
                                  disabled={['entregue', 'cancelado'].includes(order.status)}
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'entregue');
                                  }}
                                  disabled={['entregue', 'cancelado'].includes(order.status)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'cancelado');
                                  }}
                                  disabled={['entregue', 'cancelado'].includes(order.status)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={isViewingDetails}
          onClose={() => setIsViewingDetails(false)}
        />
      )}
    </AdminLayout>
  );
};

export default OrdersManagementScreen;
