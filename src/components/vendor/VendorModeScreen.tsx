
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Store, 
  Users, 
  ShoppingBag, 
  Settings, 
  CreditCard,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import Card from '../common/Card';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface VendorStats {
  totalSales: number;
  activeProducts: number;
  customersCount: number;
  pendingOrders: number;
}

const mockStats: VendorStats = {
  totalSales: 8750.50,
  activeProducts: 124,
  customersCount: 48,
  pendingOrders: 7
};

const VendorModeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats>(mockStats);

  // Menu sections for vendor
  const vendorSections = [
    {
      title: "Ajustar Pontos",
      icon: <DollarSign className="text-construPro-blue mr-3" size={20} />,
      path: "/vendor/adjust-points",
      description: "Crédito ou débito de pontos para clientes"
    },
    {
      title: "Produtos",
      icon: <ShoppingBag className="text-construPro-blue mr-3" size={20} />,
      path: "/vendor/products",
      description: "Gerenciar catálogo de produtos"
    },
    {
      title: "Clientes",
      icon: <Users className="text-construPro-blue mr-3" size={20} />,
      path: "/vendor/customers",
      description: "Ver lista de clientes e compras"
    },
    {
      title: "Configuração da Loja",
      icon: <Settings className="text-construPro-blue mr-3" size={20} />,
      path: "/vendor/store-config",
      description: "Dados e configurações da loja"
    },
    {
      title: "Pedidos Recentes",
      icon: <CreditCard className="text-construPro-blue mr-3" size={20} />,
      path: "/vendor/orders",
      description: "Gerenciar e acompanhar pedidos"
    }
  ];

  const handleExitVendorMode = () => {
    navigate('/profile');
    toast({
      title: "Modo Vendedor desativado",
      description: "Voltando para o modo normal"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 flex items-center">
        <button onClick={handleExitVendorMode} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <Store className="text-white mr-2" size={24} />
        <h1 className="text-xl font-bold text-white">Modo Vendedor</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex flex-col items-center justify-center bg-amber-50 border-amber-200">
            <h3 className="text-amber-800 font-medium text-sm mb-1">Vendas Totais</h3>
            <p className="font-bold text-amber-900 text-xl">
              R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center justify-center bg-emerald-50 border-emerald-200">
            <h3 className="text-emerald-800 font-medium text-sm mb-1">Produtos Ativos</h3>
            <p className="font-bold text-emerald-900 text-xl">
              {stats.activeProducts}
            </p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center justify-center bg-blue-50 border-blue-200">
            <h3 className="text-blue-800 font-medium text-sm mb-1">Clientes</h3>
            <p className="font-bold text-blue-900 text-xl">
              {stats.customersCount}
            </p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center justify-center bg-red-50 border-red-200">
            <h3 className="text-red-800 font-medium text-sm mb-1">Pedidos Pendentes</h3>
            <p className="font-bold text-red-900 text-xl">
              {stats.pendingOrders}
            </p>
          </Card>
        </div>
      </div>
      
      {/* Section Menu */}
      <div className="px-6 space-y-4">
        <Card className="overflow-hidden divide-y divide-gray-100">
          {vendorSections.map((section, index) => (
            <div 
              key={index} 
              className="p-4 cursor-pointer"
              onClick={() => navigate(section.path)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {section.icon}
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default VendorModeScreen;
