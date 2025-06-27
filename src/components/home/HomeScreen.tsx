
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Gift, 
  Smartphone,
  Ticket,
  Award,
  Scan,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    // Simulate user points - this can be replaced with real points fetching later
    const points = Math.floor(Math.random() * 5000);
    setUserPoints(points);
  }, []);

  const quickAccessItems = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: 'Marketplace',
      subtitle: 'Encontre produtos',
      path: '/marketplace',
      color: 'bg-blue-500'
    },
    {
      icon: <Ticket className="h-8 w-8" />,
      title: 'Meus Cupons',
      subtitle: 'Descontos disponíveis',
      path: '/meus-cupons',
      color: 'bg-orange-500'
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: 'Resgates',
      subtitle: 'Troque seus pontos',
      path: '/resgates',
      color: 'bg-green-500'
    },
    {
      icon: <Scan className="h-8 w-8" />,
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
              <Smartphone className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Matershop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-900">
                  {userPoints.toLocaleString()} pts
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="text-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user?.user_metadata?.name || 'Usuário'}!
          </h2>
          <p className="text-gray-600">
            Bem-vindo ao seu marketplace de confiança
          </p>
        </div>

        {/* Quick Access Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Acesso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickAccessItems.map((item, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                onClick={() => handleQuickAccess(item.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                    {item.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Seus Pontos</p>
                  <p className="text-2xl font-bold text-blue-600">{userPoints.toLocaleString()}</p>
                </div>
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compras</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resgates</p>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Explore o Marketplace</h3>
            <p className="text-blue-100 mb-6">
              Descubra produtos incríveis e ganhe pontos a cada compra
            </p>
            <Button
              onClick={() => navigate('/marketplace')}
              className="bg-white text-blue-600 hover:bg-gray-100"
              size="lg"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Começar a Comprar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeScreen;
