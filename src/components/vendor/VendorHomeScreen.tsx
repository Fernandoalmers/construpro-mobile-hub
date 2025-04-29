
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { ArrowUpRight, Package, Users, CreditCard, Settings } from 'lucide-react';
import pedidos from '../../data/pedidos.json';
import ajustes from '../../data/ajustes.json';

const VendorHomeScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Count recent orders (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentOrders = pedidos.filter(pedido => 
    new Date(pedido.data) > thirtyDaysAgo
  );
  
  const pendingOrders = pedidos.filter(pedido => 
    pedido.status !== 'Entregue'
  );
  
  const recentAdjustments = ajustes.filter(ajuste => 
    new Date(ajuste.data) > thirtyDaysAgo
  );
  
  const totalSales = recentOrders.reduce((sum, pedido) => sum + pedido.valorTotal, 0);

  // Quick actions
  const quickActions = [
    { 
      id: 'newAdjustment', 
      title: 'Ajustar Pontos', 
      icon: <CreditCard size={24} className="text-green-500" />,
      color: 'bg-green-100',
      onClick: () => navigate('/vendor/ajuste-pontos')
    },
    { 
      id: 'listProducts', 
      title: 'Produtos', 
      icon: <Package size={24} className="text-blue-500" />,
      color: 'bg-blue-100',
      onClick: () => navigate('/vendor/produtos')
    },
    { 
      id: 'customers', 
      title: 'Clientes', 
      icon: <Users size={24} className="text-purple-500" />,
      color: 'bg-purple-100',
      onClick: () => navigate('/vendor/clientes')
    },
    { 
      id: 'settings', 
      title: 'Configurações', 
      icon: <Settings size={24} className="text-gray-500" />,
      color: 'bg-gray-100',
      onClick: () => navigate('/vendor/configuracoes')
    }
  ];
  
  const recentOrderItems = pendingOrders.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Painel do Vendedor</h1>
          <button onClick={() => navigate('/profile')} className="text-white text-sm bg-white/20 px-2 py-1 rounded">
            Modo Cliente
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 bg-white/10 border border-white/30">
            <p className="text-white/70 text-sm mb-1">Vendas (30 dias)</p>
            <h3 className="text-white text-xl font-bold">R$ {totalSales.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
          </Card>
          
          <Card className="p-4 bg-white/10 border border-white/30">
            <p className="text-white/70 text-sm mb-1">Pedidos pendentes</p>
            <h3 className="text-white text-xl font-bold">{pendingOrders.length}</h3>
          </Card>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Card 
              key={action.id} 
              className={`p-4 ${action.color}`}
              onClick={action.onClick}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {action.icon}
                </div>
                <span className="font-medium">{action.title}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="px-6 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Pedidos recentes</h2>
          <CustomButton 
            variant="link" 
            onClick={() => navigate('/vendor/pedidos')}
            className="text-construPro-blue p-0"
          >
            Ver todos
          </CustomButton>
        </div>
        
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {recentOrderItems.map(order => (
              <div 
                key={order.id}
                className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/vendor/pedido/${order.id}`)}
              >
                <div>
                  <h3 className="font-medium">Pedido #{order.id}</h3>
                  <div className="text-sm text-gray-500">
                    {new Date(order.data).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-3">
                    <p className="font-medium text-construPro-blue">
                      R$ {order.valorTotal.toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'Em Trânsito' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <ArrowUpRight size={18} className="text-gray-400" />
                </div>
              </div>
            ))}
            
            {recentOrderItems.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum pedido pendente
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Recent Adjustments */}
      <div className="px-6 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Aj. de pontos recentes</h2>
          <CustomButton 
            variant="link" 
            onClick={() => navigate('/vendor/ajuste-pontos')}
            className="text-construPro-blue p-0"
          >
            Ver todos
          </CustomButton>
        </div>
        
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {recentAdjustments.slice(0, 3).map(adjustment => {
              const cliente = clientes.find(c => c.id === adjustment.clienteId);
              return (
                <div 
                  key={adjustment.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{cliente?.nome || 'Cliente'}</h3>
                    <div className="text-sm text-gray-500">
                      {adjustment.motivo.substring(0, 30)}
                      {adjustment.motivo.length > 30 ? '...' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${adjustment.pontos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustment.pontos >= 0 ? '+' : ''}{adjustment.pontos} pontos
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(adjustment.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {recentAdjustments.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum ajuste recente
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VendorHomeScreen;
