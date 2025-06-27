
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Gift, 
  Ticket,
  Award,
  Smartphone,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BottomTabNavigator from '@/components/layout/BottomTabNavigator';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    // Simular carregamento de pontos do usuário
    const points = Math.floor(Math.random() * 5000);
    setUserPoints(points);
  }, []);

  const quickAccessItems = [
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: 'Compras',
      subtitle: 'Marketplace',
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
      icon: <HelpCircle className="h-6 w-6" />,
      title: 'Suporte',
      subtitle: 'Ajuda e contato',
      path: '/suporte',
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

        {/* User Stats Section */}
        <div className="bg-gradient-to-r from-royal-blue to-royal-blue/80 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Seus benefícios na Matershop</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userPoints.toLocaleString()}</div>
              <div className="text-sm opacity-80">Pontos Acumulados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm opacity-80">Cupons Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm opacity-80">Resgates Realizados</div>
            </div>
          </div>
        </div>
      </div>

      <BottomTabNavigator />
    </div>
  );
};

export default HomeScreen;
