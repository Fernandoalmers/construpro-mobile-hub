
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Gift, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomTabNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  
  const tabs = [
    { path: '/home', label: 'Início', icon: Home },
    { path: '/marketplace', label: 'Loja', icon: ShoppingBag },
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
                "flex flex-col items-center justify-center w-full h-full",
                active ? "text-construPro-orange" : "text-gray-500"
              )}
              onClick={() => navigate(tab.path)}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabNavigator;
