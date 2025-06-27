
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Gift, 
  Star, 
  Truck, 
  MapPin, 
  Smartphone,
  Ticket,
  Award,
  Users,
  Store,
  Scan
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useRewardsData } from '@/hooks/useRewardsData';
import BottomTabNavigator from '@/components/layout/BottomTabNavigator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, isLoading: produtosLoading } = useMarketplaceData(null);
  const { rewards, isLoading: rewardsLoading } = useRewardsData();
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    // Simular carregamento de pontos do usuário
    const points = Math.floor(Math.random() * 5000);
    setUserPoints(points);
  }, []);

  const quickAccessItems = [
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: 'Marketplace',
      subtitle: 'Encontre produtos',
      path: '/marketplace',
      color: 'bg-blue-500'
    },
    {
      icon: <Ticket className="h-6 w-6" />,
      title: 'Meus Cupons',
      subtitle: 'Descontos disponíveis',
      path: '/meus-cupons',
      color: 'bg-orange-500'
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: 'Resgates',
      subtitle: 'Troque seus pontos',
      path: '/resgates',
      color: 'bg-green-500'
    },
    {
      icon: <Scan className="h-6 w-6" />,
      title: 'Escanear',
      subtitle: 'QR Code',
      path: '/escanear',
      color: 'bg-purple-500'
    }
  ];

  const handleQuickAccess = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-royal-blue mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Matershop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-points" />
                <span className="text-sm font-medium text-gray-900">
                  {userPoints.toLocaleString()} pts
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="text-sm"
              >
                Perfil
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Olá, {user?.user_metadata?.name || 'Usuário'}!
          </h2>
          <p className="text-gray-600">
            Bem-vindo de volta ao seu marketplace de confiança
          </p>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessItems.map((item, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleQuickAccess(item.path)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white`}>
                    {item.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Produtos em Destaque */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos em Destaque</h3>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              className="text-sm"
            >
              Ver Todos
            </Button>
          </div>
          
          {produtosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="w-full h-32 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 4).map((produto) => (
                <Card 
                  key={produto.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/produto/${produto.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {produto.imagens && produto.imagens.length > 0 ? (
                        <img 
                          src={produto.imagens[0]} 
                          alt={produto.nome}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {produto.nome}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-600">
                        R$ {produto.preco_normal?.toFixed(2)}
                      </span>
                      {produto.pontos_consumidor > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{produto.pontos_consumidor} pts
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recompensas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recompensas Populares</h3>
            <Button
              variant="outline"
              onClick={() => navigate('/resgates')}
              className="text-sm"
            >
              Ver Todas
            </Button>
          </div>
          
          {rewardsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="w-full h-24 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.slice(0, 3).map((reward) => (
                <Card 
                  key={reward.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/resgates')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg flex-shrink-0">
                        <Gift className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {reward.titulo}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {reward.pontos} pontos
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {reward.categoria}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Benefícios */}
        <div className="bg-gradient-to-r from-royal-blue to-royal-blue/80 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Por que escolher a Matershop?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Entrega Rápida</h4>
                <p className="text-sm opacity-80">Receba em casa ou na obra</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Ganhe Pontos</h4>
                <p className="text-sm opacity-80">A cada compra você acumula</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Store className="h-6 w-6 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Lojas Parceiras</h4>
                <p className="text-sm opacity-80">Rede de confiança local</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomTabNavigator />
    </div>
  );
};

export default HomeScreen;
