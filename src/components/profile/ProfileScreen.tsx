
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Star, 
  MapPin, 
  Package, 
  Heart, 
  Clock, 
  Award,
  CreditCard,
  Users,
  ShoppingBag,
  Scan,
  Headphones,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileScreen: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (nome?: string) => {
    if (!nome) return 'U';
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProfileTypeLabel = (tipo?: string) => {
    switch (tipo) {
      case 'consumidor': return 'Consumidor';
      case 'profissional': return 'Profissional';
      case 'vendedor': return 'Vendedor';
      default: return 'Usuário';
    }
  };

  // Menu items baseado no tipo de perfil
  const getMenuItems = () => {
    const baseItems = [
      { icon: ShoppingBag, label: 'Compras', route: '/compras', color: 'text-blue-600' },
      { icon: Scan, label: 'Escanear', route: '/escanear', color: 'text-green-600' },
      { icon: Headphones, label: 'Suporte', route: '/suporte', color: 'text-purple-600' },
    ];

    const profileItems = [
      { icon: User, label: 'Dados Pessoais', route: '/profile/user-data' },
      { icon: MapPin, label: 'Endereços', route: '/profile/addresses' },
      { icon: Package, label: 'Pedidos', route: '/profile/orders' },
      { icon: Clock, label: 'Histórico de Pontos', route: '/profile/points-history' },
      { icon: Heart, label: 'Favoritos', route: '/profile/favorites' },
      { icon: Users, label: 'Indicações', route: '/profile/referrals' },
      { icon: Star, label: 'Avaliações', route: '/profile/reviews' },
      { icon: Settings, label: 'Configurações', route: '/profile/settings' },
    ];

    return { baseItems, profileItems };
  };

  const { baseItems, profileItems } = getMenuItems();

  const navigateToArea = () => {
    switch (profile?.tipo_perfil) {
      case 'profissional':
        navigate('/services');
        break;
      case 'vendedor':
        navigate('/vendor');
        break;
      default:
        navigate('/marketplace');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header com informações do usuário */}
      <div className="bg-construPro-blue px-6 py-8 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-white text-construPro-blue text-lg font-semibold">
              {getInitials(profile?.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{profile?.nome || 'Usuário'}</h1>
            <p className="text-blue-100">{profile?.email}</p>
            <div className="flex items-center mt-1">
              <span className="text-sm bg-blue-700 px-2 py-1 rounded-full">
                {getProfileTypeLabel(profile?.tipo_perfil)}
              </span>
              {profile?.especialidade_profissional && (
                <span className="text-sm bg-green-600 px-2 py-1 rounded-full ml-2">
                  {profile.especialidade_profissional}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pontos */}
        <div className="mt-4 bg-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Meus Pontos</p>
              <p className="text-2xl font-bold">{profile?.saldo_pontos || 0}</p>
            </div>
            <Award className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6">
        {/* Acesso rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {baseItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.route)}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <item.icon className={`h-6 w-6 mb-2 ${item.color}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Área específica do perfil */}
        <Card>
          <CardContent className="p-4">
            <button
              onClick={navigateToArea}
              className="w-full flex items-center justify-between p-3 bg-construPro-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {profile?.tipo_perfil === 'profissional' ? 'Área Profissional' :
                   profile?.tipo_perfil === 'vendedor' ? 'Área do Vendedor' :
                   'Marketplace'}
                </span>
              </div>
              <ChevronRight className="h-5 w-5" />
            </button>
          </CardContent>
        </Card>

        {/* Menu do perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profileItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileScreen;
