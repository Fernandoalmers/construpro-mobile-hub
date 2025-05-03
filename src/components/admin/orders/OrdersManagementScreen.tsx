
import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, Search, RefreshCw, ShoppingBag, 
  User, Clock, DollarSign, Truck, Edit, Eye 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, 
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { 
  AdminOrder, fetchAdminOrders, updateOrderStatus,
  updateTrackingCode, getOrderStatusBadgeColor
} from '@/services/adminOrdersService';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const OrdersManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAdminLoading) {
      return; // Aguardar verificação de administrador
    }
    
    if (!isAdmin) {
      setError('Acesso não autorizado: Apenas administradores podem acessar esta página');
      setIsLoading(false);
      return;
    }
    
    loadOrders();
  }, [isAdmin, isAdminLoading]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const ordersData = await fetchAdminOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Erro ao carregar pedidos. Tente novamente.');
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar pedidos com base na busca e filtros
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      !searchTerm || 
      order.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.loja_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await updateOrderStatus(orderId, status);
      
      // Atualizar estado local
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTrackingCode = async (orderId: string) => {
    if (isProcessing) return;
    
    const trackingCode = prompt('Insira o código de rastreio:');
    if (!trackingCode) return;
    
    try {
      setIsProcessing(true);
      await updateTrackingCode(orderId, trackingCode);
      
      // Atualizar estado local
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, rastreio: trackingCode } : order
        )
      );
      
      toast.success('Código de rastreio atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar código de rastreio');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Se ainda está verificando se é admin
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Pedidos">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // Se não for admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Pedidos">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // Se houver erro ao carregar os pedidos
  if (error) {
    return (
      <AdminLayout currentSection="Pedidos">
        <ErrorState 
          title="Erro ao carregar pedidos" 
          message={error}
          onRetry={loadOrders}
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
            Visualize e gerencie todos os pedidos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, loja ou ID do pedido"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="enviado">Enviados</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                  <SelectItem value="concluido">Concluídos</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingState text="Carregando pedidos..." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum pedido encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ShoppingBag size={16} className="text-gray-400" />
                            {order.id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User size={16} className="text-gray-400" />
                            <span>{order.cliente_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-gray-400" />
                            {formatMoney(order.valor_total)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getOrderStatusBadgeColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.forma_pagamento}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-gray-400" />
                            <span>{formatDate(order.data_criacao)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => window.location.href = `/admin/order-details/${order.id}`}>
                                  <Eye size={16} className="mr-2 text-blue-600" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Atualizar Status</DropdownMenuLabel>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'pendente')}>
                                  <Badge className={getOrderStatusBadgeColor('pendente')} variant="outline">
                                    Pendente
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processando')}>
                                  <Badge className={getOrderStatusBadgeColor('processando')} variant="outline">
                                    Processando
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'enviado')}>
                                  <Badge className={getOrderStatusBadgeColor('enviado')} variant="outline">
                                    Enviado
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}>
                                  <Badge className={getOrderStatusBadgeColor('entregue')} variant="outline">
                                    Entregue
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'concluido')}>
                                  <Badge className={getOrderStatusBadgeColor('concluido')} variant="outline">
                                    Concluído
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')}>
                                  <Badge className={getOrderStatusBadgeColor('cancelado')} variant="outline">
                                    Cancelado
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => handleUpdateTrackingCode(order.id)}>
                                  <Truck size={16} className="mr-2 text-purple-600" />
                                  {order.rastreio ? 'Atualizar Rastreio' : 'Adicionar Rastreio'}
                                </DropdownMenuItem>
                                
                                {order.rastreio && (
                                  <DropdownMenuItem>
                                    <div className="text-xs text-gray-500">
                                      Rastreio: {order.rastreio}
                                    </div>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Exibindo {filteredOrders.length} de {orders.length} pedidos
          </p>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default OrdersManagementScreen;
