
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, Users, Settings, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorProfile } from '@/services/vendorService';
import LoadingState from '../common/LoadingState';
import { toast } from '@/components/ui/sonner';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, description, onClick }) => {
  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-md transition-shadow flex items-start"
      onClick={onClick}
    >
      <div className="rounded-full bg-construPro-blue/10 p-3 mr-4">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Card>
  );
};

const VendorModeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Fetch vendor profile to check if it exists
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: getVendorProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const menuItems: MenuItemProps[] = [
    {
      icon: <Package className="text-construPro-blue" />,
      title: "Produtos",
      description: "Cadastre e gerencie os produtos da sua loja",
      onClick: () => navigate('/vendor/products')
    },
    {
      icon: <Store className="text-construPro-blue" />,
      title: "Pedidos",
      description: "Acompanhe os pedidos feitos na sua loja",
      onClick: () => navigate('/vendor/orders')
    },
    {
      icon: <Users className="text-construPro-blue" />,
      title: "Clientes",
      description: "Gerencie os clientes e visualize histórico de compras",
      onClick: () => navigate('/vendor/customers')
    },
    {
      icon: <Tag className="text-construPro-blue" />,
      title: "Ajuste de Pontos",
      description: "Adicione ou remova pontos dos clientes",
      onClick: () => navigate('/vendor/adjust-points')
    },
    {
      icon: <Settings className="text-construPro-blue" />,
      title: "Configurações da Loja",
      description: "Edite as informações e configurações da sua loja",
      onClick: () => navigate('/vendor/store-config')
    }
  ];

  const handleBackToConsumerMode = () => {
    navigate('/home');
  };
  
  if (isLoading) {
    return <LoadingState text="Carregando..." />;
  }
  
  // If there's no vendor profile, redirect to vendor registration
  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Store size={48} className="mx-auto text-construPro-blue mb-4" />
          <h1 className="text-2xl font-bold mb-2">Modo Lojista</h1>
          <p className="text-gray-600 mb-6">
            Você ainda não configurou seu perfil de lojista. Complete seu cadastro para começar a vender.
          </p>
          <Button 
            onClick={() => navigate('/auth/vendor-profile')}
            className="w-full bg-construPro-blue hover:bg-blue-700"
          >
            Configurar Perfil de Lojista
          </Button>
          <Button 
            variant="outline"
            className="w-full mt-4"
            onClick={handleBackToConsumerMode}
          >
            Voltar para Modo Cliente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-construPro-blue text-white p-6">
        <div className="container mx-auto">
          <button 
            onClick={handleBackToConsumerMode}
            className="flex items-center mb-6 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            Voltar para Modo Cliente
          </button>
          
          <div className="flex items-center">
            {vendorProfile.logo ? (
              <img 
                src={vendorProfile.logo} 
                alt={vendorProfile.nome_loja} 
                className="w-16 h-16 rounded-full bg-white p-1 mr-4 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mr-4">
                <Store size={32} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{vendorProfile.nome_loja}</h1>
              <p className="text-white/80">Modo Lojista</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <MenuItem 
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorModeScreen;
