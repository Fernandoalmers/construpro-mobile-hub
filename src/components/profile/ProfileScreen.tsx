
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Heart, 
  Gift, 
  Users, 
  Star,
  CreditCard,
  MapPin,
  LogOut,
  ArrowRight,
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error("Erro ao fazer logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    {
      title: 'Dados Pessoais',
      description: 'Gerencie suas informações',
      icon: User,
      route: '/profile/dados',
      color: 'bg-blue-500'
    },
    {
      title: 'Pedidos',
      description: 'Histórico de compras',
      icon: ShoppingBag,
      route: '/profile/pedidos',
      color: 'bg-green-500'
    },
    {
      title: 'Favoritos',
      description: 'Produtos salvos',
      icon: Heart,
      route: '/profile/favoritos',
      color: 'bg-red-500'
    },
    {
      title: 'Histórico de Pontos',
      description: 'Acompanhe seus pontos',
      icon: Gift,
      route: '/profile/pontos',
      color: 'bg-purple-500'
    },
    {
      title: 'Indicações',
      description: 'Convide amigos',
      icon: Users,
      route: '/profile/indicacoes',
      color: 'bg-construPro-orange'
    },
    {
      title: 'Endereços',
      description: 'Gerencie endereços',
      icon: MapPin,
      route: '/profile/enderecos',
      color: 'bg-indigo-500'
    },
    {
      title: 'Configurações',
      description: 'Preferências da conta',
      icon: Settings,
      route: '/profile/configuracoes',
      color: 'bg-gray-500'
    }
  ];

  const pointsLevel = Math.floor((profile?.saldo_pontos || 0) / 1000) + 1;
  const pointsToNextLevel = 1000 - ((profile?.saldo_pontos || 0) % 1000);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header with black background */}
      <div className="bg-black py-8 px-4 rounded-b-2xl shadow-lg">
        <div className="text-center">
          <div className="relative mb-4">
            <Avatar className="w-20 h-20 mx-auto border-4 border-white/20">
              <img 
                src={profile?.avatar || '/placeholder.svg'} 
                alt={profile?.nome || 'Avatar'} 
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-construPro-orange rounded-full p-1">
              <Award size={16} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-1">
            {profile?.nome || 'Usuário'}
          </h1>
          
          <p className="text-gray-200 text-sm mb-3">
            {profile?.email}
          </p>

          <Badge className="bg-white/10 text-white border-white/20">
            Nível {pointsLevel}
          </Badge>
        </div>

        {/* Points Summary */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-white">
                {(profile?.saldo_pontos || 0).toLocaleString()}
              </p>
              <p className="text-gray-200 text-sm">Pontos disponíveis</p>
            </div>
            
            <div className="w-px h-12 bg-white/20 mx-4"></div>
            
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-construPro-orange">
                {pointsToNextLevel.toLocaleString()}
              </p>
              <p className="text-gray-200 text-sm">Para próximo nível</p>
            </div>
          </div>

          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-construPro-orange h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${((profile?.saldo_pontos || 0) % 1000) / 10}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <TrendingUp size={20} className="text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Este mês</p>
            <p className="font-bold text-black">+245 pts</p>
          </Card>
          
          <Card className="p-3 text-center">
            <Calendar size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Membro desde</p>
            <p className="font-bold text-black">Jan 2024</p>
          </Card>
          
          <Card className="p-3 text-center">
            <Star size={20} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Resgates</p>
            <p className="font-bold text-black">5 itens</p>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(item.route)}
            >
              <div className="flex items-center">
                <div className={`${item.color} p-3 rounded-full mr-4`}>
                  <item.icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <ArrowRight size={18} className="text-gray-400" />
              </div>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="mt-6 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={20} className="mr-4" />
            {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ProfileScreen;
