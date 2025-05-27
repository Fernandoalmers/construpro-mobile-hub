
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Gift, 
  ShoppingBag, 
  Heart, 
  Settings, 
  FileText,
  CreditCard,
  Users,
  Package,
  MessageCircle
} from 'lucide-react';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Carregando perfil...</h2>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      title: 'Dados Pessoais',
      description: 'Gerencie suas informações pessoais',
      onClick: () => navigate('/profile/user-data'),
      color: 'text-blue-600'
    },
    {
      icon: MapPin,
      title: 'Endereços',
      description: 'Gerencie seus endereços de entrega',
      onClick: () => navigate('/profile/addresses'),
      color: 'text-green-600'
    },
    {
      icon: ShoppingBag,
      title: 'Meus Pedidos',
      description: 'Acompanhe seus pedidos online',
      onClick: () => navigate('/profile/orders'),
      color: 'text-orange-600'
    },
    {
      icon: Package,
      title: 'Compras Físicas',
      description: 'Histórico de compras nas lojas',
      onClick: () => navigate('/profile/physical-purchases'),
      color: 'text-purple-600'
    },
    {
      icon: Star,
      title: 'Histórico de Pontos',
      description: 'Acompanhe seus pontos acumulados',
      onClick: () => navigate('/profile/points-history'),
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'Indicações',
      description: 'Convide amigos e ganhe pontos',
      onClick: () => navigate('/profile/referrals'),
      color: 'text-pink-600'
    },
    {
      icon: Heart,
      title: 'Favoritos',
      description: 'Produtos que você curtiu',
      onClick: () => navigate('/profile/favorites'),
      color: 'text-red-600'
    },
    {
      icon: FileText,
      title: 'Avaliações',
      description: 'Suas avaliações de produtos',
      onClick: () => navigate('/profile/reviews'),
      color: 'text-indigo-600'
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Preferências do aplicativo',
      onClick: () => navigate('/profile/settings'),
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header com informações do usuário */}
      <div className="bg-construPro-blue text-white">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage src={profile.avatar || ''} alt={profile.nome || 'Avatar'} />
              <AvatarFallback className="bg-construPro-orange text-white text-lg font-bold">
                {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.nome || 'Usuário'}</h1>
              <p className="text-construPro-blue-light opacity-90">{profile.email}</p>
              
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary" className="bg-construPro-orange text-white">
                  {profile.tipo_perfil === 'consumidor' && 'Consumidor'}
                  {profile.tipo_perfil === 'profissional' && 'Profissional'}
                  {profile.tipo_perfil === 'vendedor' && 'Vendedor'}
                </Badge>
                
                <div className="flex items-center space-x-1">
                  <Gift className="w-4 h-4" />
                  <span className="font-semibold">{profile.saldo_pontos || 0} pontos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu de opções */}
      <div className="p-4">
        <div className="grid gap-3">
          {menuItems.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={item.onClick}>
              <CardContent className="flex items-center p-4">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações do perfil */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Sair da conta
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Matershop - Sua construção em boas mãos</p>
          <p className="mt-1">Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
