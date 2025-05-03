
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Import Lucide icons
import { 
  Home, 
  ShoppingBag, 
  Gift, 
  User, 
  MessageSquare,
  QrCode,
  Store,
  Wrench
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
import CartPopup from '../marketplace/CartPopup';

interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
  tooltip: string;
  show: (role: string) => boolean;
}

const BottomTabNavigator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState('');
  const { user, profile } = useAuth();
  const { cartCount } = useCart();
  
  // Extract the first part of the path
  useEffect(() => {
    const pathBase = '/' + location.pathname.split('/')[1];
    setCurrentPath(pathBase);
  }, [location.pathname]);

  // User role
  const userRole = profile?.papel || 'consumidor';

  // Menu Items
  const menuItems: MenuItem[] = [
    { 
      name: 'Início', 
      icon: <Home size={24} />, 
      path: '/home', 
      tooltip: 'Voltar para a página inicial',
      show: (role) => role === 'consumidor'
    },
    { 
      name: 'Loja', 
      icon: <ShoppingBag size={24} />, 
      path: '/marketplace',
      tooltip: 'Navegar pela loja online',
      show: (role) => role === 'consumidor'
    },
    { 
      name: 'QR Code', 
      icon: <QrCode size={24} />, 
      path: '/qrcode',
      tooltip: 'Escanear QR Code para pontos',
      show: (role) => role === 'consumidor'
    },
    { 
      name: 'Resgates', 
      icon: <Gift size={24} />, 
      path: '/resgates',
      tooltip: 'Ver resgates disponíveis',
      show: (role) => role === 'consumidor'
    },
    { 
      name: 'Chat', 
      icon: <MessageSquare size={24} />, 
      path: '/chat',
      tooltip: 'Mensagens e suporte',
      show: (role) => true
    },
    // Admin-specific items
    { 
      name: 'Gerenciar', 
      icon: <Store size={24} />, 
      path: '/vendor',
      tooltip: 'Gerenciar sua loja',
      show: (role) => role === 'lojista' || role === 'vendedor'
    },
    { 
      name: 'Serviços', 
      icon: <Wrench size={24} />, 
      path: '/services',
      tooltip: 'Gerenciar serviços',
      show: (role) => role === 'profissional'
    },
    { 
      name: 'Perfil', 
      icon: <User size={24} />, 
      path: '/profile',
      tooltip: 'Ver seu perfil',
      show: (role) => true
    },
  ];
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.show(userRole));
  
  // Only show navigation on certain paths
  if (!user || location.pathname === '/login' || location.pathname === '/signup' || 
      location.pathname === '/onboarding' || location.pathname === '/splash') {
    return null;
  }

  return (
    <>
      {/* Cart Popup */}
      <CartPopup />
      
      <TooltipProvider delayDuration={300}>
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-md z-40">
          <div className="flex justify-around items-center h-16">
            {filteredMenuItems.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full cursor-pointer px-2", 
                      currentPath === item.path ? "text-construPro-blue" : "text-gray-500"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.path === '/marketplace' && cartCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-construPro-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartCount}
                        </div>
                      )}
                    </div>
                    <span className="text-xs mt-1">{item.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </nav>
      </TooltipProvider>
    </>
  );
};

export default BottomTabNavigator;
