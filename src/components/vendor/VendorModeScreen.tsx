import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getVendorProfile } from '@/services/vendorService';
import LoadingState from '../common/LoadingState';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const VendorModeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Fetch vendor profile to check if it exists
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: getVendorProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const menuItems = [
    {
      title: "Produtos",
      description: "Cadastre e gerencie os produtos da sua loja",
      path: '/vendor/products'
    },
    {
      title: "Pedidos",
      description: "Acompanhe os pedidos feitos na sua loja",
      path: '/vendor/orders'
    },
    {
      title: "Clientes",
      description: "Gerencie os clientes e visualize histórico de compras",
      path: '/vendor/customers'
    },
    {
      title: "Ajuste de Pontos",
      description: "Adicione ou remova pontos dos clientes",
      path: '/vendor/adjust-points'
    },
    {
      title: "Configurações da Loja",
      description: "Edite as informações e configurações da sua loja",
      path: '/vendor/store-config'
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
      <div className="bg-white border-b p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToConsumerMode}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Modo Lojista</h1>
            <p className="text-sm text-muted-foreground">{vendorProfile.nome_loja}</p>
          </div>
        </div>
        {vendorProfile.logo && (
          <img 
            src={vendorProfile.logo} 
            alt={vendorProfile.nome_loja} 
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
      </div>
      
      {/* Menu Items */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorModeScreen;
