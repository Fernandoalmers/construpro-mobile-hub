
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Settings, 
  LogOut, 
  ChevronRight,
  Gift,
  Star,
  Users,
  CreditCard,
  // Receipt, // Commented out as we're hiding physical purchases
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    {
      icon: <User size={20} />,
      title: 'Dados pessoais',
      subtitle: 'Edite suas informações',
      path: '/profile/user-data'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Endereços',
      subtitle: 'Gerencie seus endereços',
      path: '/profile/addresses'
    },
    {
      icon: <ShoppingBag size={20} />,
      title: 'Minhas compras',
      subtitle: 'Histórico de pedidos',
      path: '/profile/orders'
    },
    // Commented out Physical Purchases section as requested
    // {
    //   icon: <Receipt size={20} />,
    //   title: 'Compras físicas',
    //   subtitle: 'Notas fiscais vinculadas',
    //   path: '/profile/physical-purchases'
    // },
    {
      icon: <CreditCard size={20} />,
      title: 'Histórico de pontos',
      subtitle: 'Veja ganhos e resgates',
      path: '/profile/points-history'
    },
    {
      icon: <Users size={20} />,
      title: 'Indicações',
      subtitle: 'Convide amigos',
      path: '/profile/referrals'
    },
    {
      icon: <Heart size={20} />,
      title: 'Favoritos',
      subtitle: 'Produtos salvos',
      path: '/profile/favorites'
    },
    {
      icon: <Star size={20} />,
      title: 'Minhas avaliações',
      subtitle: 'Avalie produtos comprados',
      path: '/profile/reviews'
    },
    {
      icon: <Gift size={20} />,
      title: 'Recompensas',
      subtitle: 'Troque seus pontos',
      path: '/rewards'
    }
  ];

  const supportItems = [
    {
      icon: <HelpCircle size={20} />,
      title: 'Central de ajuda',
      subtitle: 'FAQ e suporte',
      path: '/suporte'
    },
    {
      icon: <Settings size={20} />,
      title: 'Configurações',
      subtitle: 'Preferências do app',
      path: '/profile/settings'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-white text-construPro-blue text-lg font-semibold">
              {profile?.nome?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              {profile?.nome || 'Usuário'}
            </h1>
            <p className="text-blue-100">
              {user?.email}
            </p>
            {profile?.saldo_pontos !== undefined && (
              <div className="flex items-center mt-1">
                <Gift size={16} className="text-construPro-orange mr-1" />
                <span className="text-construPro-orange font-semibold">
                  {profile.saldo_pontos} pontos
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-6 space-y-6">
        {/* Account Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-800">Minha conta</h2>
          <Card className="overflow-hidden">
            {menuItems.map((item, index) => (
              <div key={item.title}>
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-construPro-blue">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-800">Suporte</h2>
          <Card className="overflow-hidden">
            {supportItems.map((item, index) => (
              <div key={item.title}>
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-construPro-blue">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
                {index < supportItems.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut size={20} className="mr-3" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
};

export default ProfileScreen;
