
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import { 
  Users, Store, ShoppingBag, Gift, 
  Tag, FileText, LogOut, Home, 
  BarChart3, Settings, Clock, Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

interface AdminLayoutProps {
  children: ReactNode;
  currentSection: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentSection }) => {
  const { isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info('Sessão encerrada');
    navigate('/login');
  };

  if (isLoading) {
    return <LoadingState text="Verificando permissões..." />;
  }

  if (!isAdmin) {
    navigate('/home');
    return null;
  }

  const navigationItems = [
    { label: 'Dashboard', icon: <BarChart3 size={20} />, path: '/admin' },
    { label: 'Usuários', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Produtos', icon: <ShoppingBag size={20} />, path: '/admin/products' },
    { label: 'Lojas', icon: <Store size={20} />, path: '/admin/stores' },
    { label: 'Resgates', icon: <Gift size={20} />, path: '/admin/redemptions' },
    { label: 'Recompensas', icon: <Gift size={20} />, path: '/admin/rewards' },
    { label: 'Categorias', icon: <Tag size={20} />, path: '/admin/categories' },
    { label: 'Pedidos', icon: <ShoppingBag size={20} />, path: '/admin/orders' },
    { label: 'Cupons', icon: <Ticket size={20} />, path: '/admin/coupons' },
    { label: 'Logs', icon: <Clock size={20} />, path: '/admin/logs' },
    { label: 'Configurações', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 bg-construPro-blue text-white">
          <h2 className="text-xl font-bold">ConstruPro Admin</h2>
          <p className="text-sm opacity-80">Painel Administrativo</p>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start pl-4 ${
                    currentSection === item.label.toLowerCase() 
                      ? 'bg-gray-100 text-construPro-blue font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/home')}
            >
              <Home size={18} className="mr-2" />
              App
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-red-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">{currentSection}</h1>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
