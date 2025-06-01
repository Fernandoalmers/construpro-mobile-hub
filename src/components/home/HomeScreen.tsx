
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Heart, 
  Gift, 
  Users, 
  TrendingUp, 
  Award,
  Star,
  ArrowRight,
  QrCode,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    if (profile?.saldo_pontos) {
      setCurrentPoints(profile.saldo_pontos);
    }
  }, [profile]);

  const quickActions = [
    {
      title: 'Marketplace',
      description: 'Compre produtos e ganhe pontos',
      icon: ShoppingCart,
      color: 'bg-construPro-orange',
      route: '/marketplace'
    },
    {
      title: 'Escanear QR',
      description: 'Ganhe pontos em lojas físicas',
      icon: QrCode,
      color: 'bg-green-500',
      route: '/escanear'
    },
    {
      title: 'Resgates',
      description: 'Troque pontos por recompensas',
      icon: Gift,
      color: 'bg-purple-500',
      route: '/resgates'
    },
    {
      title: 'Convites',
      description: 'Convide amigos e ganhe mais',
      icon: Users,
      color: 'bg-blue-500',
      route: '/convite'
    }
  ];

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  const nextLevel = Math.ceil(currentPoints / 1000) * 1000;
  const progressToNext = nextLevel > 0 ? (currentPoints / nextLevel) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black py-8 px-4 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Olá, {profile?.nome || 'Usuário'}!</h1>
            <p className="text-gray-200 text-sm">Bem-vindo de volta ao Matershop</p>
          </div>
          <div className="text-right">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs">Seus pontos</p>
              <p className="text-white text-xl font-bold">{currentPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">Progresso para {nextLevel.toLocaleString()} pts</span>
            <span className="text-white text-sm">{Math.round(progressToNext)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-construPro-orange h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-black mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Card 
              key={index}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction(action.route)}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`${action.color} p-3 rounded-full mb-2`}>
                  <action.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-sm text-black">{action.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{action.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Highlights Section */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-black mb-4">Destaques</h2>
        
        {/* Level System Card */}
        <Card className="p-4 mb-4 bg-gradient-to-r from-construPro-orange to-orange-400">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="font-bold">Sistema de Níveis</h3>
              <p className="text-sm opacity-90">Suba de nível e desbloqueie benefícios</p>
            </div>
            <Award size={32} />
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Este mês</p>
                <p className="font-bold text-black">+245 pts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Heart size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Favoritos</p>
                <p className="font-bold text-black">12 itens</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="font-bold text-black mb-3">Atividade Recente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Zap size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Compra realizada</p>
                  <p className="text-xs text-gray-600">2 dias atrás</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                +50 pts
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-construPro-orange/10 p-2 rounded-full mr-3">
                  <Star size={14} className="text-construPro-orange" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Resgate realizado</p>
                  <p className="text-xs text-gray-600">5 dias atrás</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-construPro-orange/10 text-construPro-orange">
                -100 pts
              </Badge>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-3 text-black hover:bg-gray-100"
            onClick={() => navigate('/profile/pontos')}
          >
            Ver histórico completo
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default HomeScreen;
