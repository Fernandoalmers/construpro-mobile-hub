
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Gift, MessageSquare, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '../../context/AuthContext';

const BottomTabNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  
  const tabs = [
    { path: '/home', label: 'Início', icon: Home },
    { path: '/marketplace', label: 'Loja', icon: ShoppingBag },
    { path: '/services', label: 'Serviços', icon: Briefcase },
    { path: '/resgates', label: 'Resgates', icon: Gift },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  // Don't render the tab bar on certain routes
  const shouldHideTabBar = [
    '/login',
    '/signup',
    '/onboarding',
    '/'
  ].includes(pathname) || pathname.startsWith('/vendor');

  if (shouldHideTabBar) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/home' && pathname === '/home') {
      return true;
    }
    if (path === '/marketplace') {
      return pathname === '/marketplace' || 
        pathname.startsWith('/produto') || 
        pathname === '/cart' ||
        pathname === '/checkout';
    }
    if (path === '/services') {
      return pathname === '/services' || 
        pathname.startsWith('/services/') ||
        pathname.includes('professional');
    }
    if (path === '/resgates') {
      return pathname === '/resgates' || 
        pathname.startsWith('/resgate') || 
        pathname === '/historico-resgates';
    }
    if (path === '/chat') {
      return pathname === '/chat' || pathname.startsWith('/chat/');
    }
    if (path === '/profile') {
      return pathname === '/profile';
    }
    return false;
  };

  const handleNavigation = (path: string) => {
    // Para rotas que exigem autenticação e o usuário não está logado
    if (['/resgates', '/chat', '/profile', '/services'].includes(path) && !user) {
      toast.info("Faça login para acessar esta funcionalidade");
      navigate('/login');
      return;
    }

    // Add a slight delay to make the transition feel more natural
    setTimeout(() => {
      navigate(path);
    }, 50);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all",
                active ? "text-construPro-orange" : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => handleNavigation(tab.path)}
            >
              <div className={cn(
                "flex items-center justify-center",
                active ? "scale-110 transition-transform" : ""
              )}>
                <Icon size={20} />
              </div>
              <span className={cn(
                "text-xs mt-1",
                active ? "font-medium" : ""
              )}>
                {tab.label}
              </span>
              {active && (
                <div className="h-1 w-8 bg-construPro-orange rounded-full absolute -bottom-0.5 animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabNavigator;
