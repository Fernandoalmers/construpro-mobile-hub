import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/order/getOrders';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { formatCurrency } from '@/utils/formatCurrency';

const ComprasScreen: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'processando':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'enviado':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return orderDate >= threeMonthsAgo;
        default:
          return true;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return <LoadingState text="Carregando suas compras..." />;
  }

  if (error) {
    return <ErrorState title="Erro" message="Não foi possível carregar suas compras. Tente novamente." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-4 pt-12">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-2 mr-2 text-white hover:bg-white/20" 
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-white">Minhas Compras</h1>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-6 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-lg mb-2">Nenhuma compra encontrada</h3>
            <p className="text-gray-600 mb-4">
              {orders.length === 0 
                ? "Você ainda não fez nenhuma compra."
                : "Nenhuma compra encontrada com os filtros aplicados."
              }
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              Ir às compras
            </Button>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card 
              key={order.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/profile/orders/${order.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">Pedido #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {(order.items && order.items.length > 0) ? order.items.length : 0} {((order.items && order.items.length === 1) ? 'item' : 'itens')}
                  </p>
                  {order.items && order.items.length > 0 && order.items[0] && (
                    <p className="text-sm text-gray-800 font-medium">
                      {order.items[0].produto?.nome || 'Produto'}
                      {order.items.length > 1 && ` +${order.items.length - 1} mais`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-construPro-blue">
                    {formatCurrency(order.valor_total)}
                  </p>
                  {order.pontos_ganhos && order.pontos_ganhos > 0 && (
                    <p className="text-xs text-green-600">
                      +{order.pontos_ganhos} pontos
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ComprasScreen;
