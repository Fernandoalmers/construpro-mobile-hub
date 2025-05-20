
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, CreditCard, Settings, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import LoadingState from '../common/LoadingState';

const VendorModeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { vendorProfile, isLoading } = useVendorProfile();
  
  const menuItems = [
    { 
      title: 'Pedidos', 
      icon: <Package className="h-8 w-8" />,
      description: 'Gerencie os pedidos da sua loja',
      color: 'bg-blue-100 text-blue-600',
      onClick: () => navigate('/vendor/orders')
    },
    { 
      title: 'Produtos', 
      icon: <Store className="h-8 w-8" />,
      description: 'Cadastre e gerencie seus produtos',
      color: 'bg-green-100 text-green-600',
      onClick: () => navigate('/vendor/products')
    },
    { 
      title: 'Clientes', 
      icon: <Users className="h-8 w-8" />,
      description: 'Visualize e gerencie seus clientes',
      color: 'bg-purple-100 text-purple-600',
      onClick: () => navigate('/vendor/customers')
    },
    { 
      title: 'Ajuste de Pontos', 
      icon: <CreditCard className="h-8 w-8" />,
      description: 'Adicione ou remova pontos de clientes',
      color: 'bg-amber-100 text-amber-600',
      onClick: () => navigate('/vendor/ajuste-pontos')
    },
    { 
      title: 'Configurações', 
      icon: <Settings className="h-8 w-8" />,
      description: 'Configure sua loja',
      color: 'bg-gray-100 text-gray-600',
      onClick: () => navigate('/vendor/settings')
    }
  ];

  if (isLoading) {
    return <LoadingState text="Carregando perfil de vendedor..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <h1 className="text-2xl font-bold">Portal do Vendedor</h1>
            <div className="flex items-center gap-2">
              {vendorProfile?.logo && (
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <img
                    src={vendorProfile.logo}
                    alt={vendorProfile.nome_loja}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="font-medium">{vendorProfile?.nome_loja || 'Sua Loja'}</h2>
                <p className="text-sm text-gray-500">{vendorProfile?.status || 'pendente'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Card
              key={index}
              className="p-6 cursor-pointer hover:shadow-md transition-all"
              onClick={item.onClick}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                <div className={`${item.color} p-3 rounded-lg`}>
                  {item.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorModeScreen;
