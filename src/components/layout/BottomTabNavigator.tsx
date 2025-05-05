
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
  Store,
  Wrench,
  ShoppingCart
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import CartPopup from '../marketplace/CartPopup';
import { useCart } from '@/hooks/use-cart';

interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
  tooltip: string;
  show: (role?: string) => boolean;
  badge?: number;
}

const BottomTabNavigator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState('');
  const { user, profile, isLoading } = useAuth();
  const { cartCount = 0 } = useCart();  // Use the useCart hook to get the cart count
  
  // Extract the first part of the path
  useEffect(() => {
    // Look for exact matches first, then fallback to path base
    const exactPaths = ['/home', '/marketplace', '/rewards', '/chat', '/vendor-dashboard', '/services', '/profile'];
    
    if (exactPaths.includes(location.pathname)) {
      setCurrentPath(location.pathname);
    } else {
      // For nested paths, highlight the parent menu item
      const pathBase = '/' + (location.pathname.split('/')[1] || 'home');
      setCurrentPath(pathBase);
    }
    
    console.log("Bottom navigation current path:", location.pathname, "-> Highlighted:", currentPath);
  }, [location.pathname]);

  // User role
  const userRole = profile?.papel || 'consumidor';

  // Debug rendering
  useEffect(() => {
    console.log("BottomTabNavigator rendering:", { 
      path: location.pathname,
      currentPath,
      userRole,
      isAuthenticated: !!user,
      isLoading,
      cartCount
    });
  }, [location.pathname, currentPath, userRole, user, isLoading, cartCount]);

  // Menu Items
  const menuItems: MenuItem[] = [
    { 
      name: 'Início', 
      icon: <Home size={24} />, 
      path: '/home', 
      tooltip: 'Voltar para a página inicial',
      show: () => true
    },
    { 
      name: 'Loja', 
      icon: <ShoppingBag size={24} />, 
      path: '/marketplace',
      tooltip: 'Navegar pela loja online',
      // No badge here - we'll show it on the Cart menu item
      show: (role) => role === 'consumidor' || !role
    },
    { 
      name: 'Carrinho', 
      icon: <ShoppingCart size={24} />, 
      path: '/cart',
      tooltip: 'Ver carrinho de compras',
      badge: cartCount > 0 ? cartCount : undefined,  // Show badge on cart icon
      show: (role) => role === 'consumidor' || !role 
    },
    { 
      name: 'Resgates', 
      icon: <Gift size={24} />, 
      path: '/rewards',
      tooltip: 'Ver resgates disponíveis',
      show: (role) => role === 'consumidor' || !role
    },
    { 
      name: 'Chat', 
      icon: <MessageSquare size={24} />, 
      path: '/chat',
      tooltip: 'Mensagens e suporte',
      show: () => true
    },
    // Role-specific items
    { 
      name: 'Gerenciar', 
      icon: <Store size={24} />, 
      path: '/vendor-dashboard',
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
      show: () => true
    },
  ];
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.show(userRole));
  
  // Show loading placeholder while auth is loading to prevent UI jumps
  if (isLoading) {
    return (
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-md z-40">
        <div className="flex justify-around items-center h-16">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center w-full h-full px-2">
              <div className="h-6 w-6 bg-gray-200 rounded-full mb-1"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  // Don't show navigation on certain paths
  if (!user || 
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/onboarding' || 
      location.pathname === '/splash' ||
      location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleNavigation = (path: string) => {
    // Only navigate if we're not already on this path
    if (location.pathname !== path) {
      navigate(path);
    }
  };

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
                    onClick={() => handleNavigation(item.path)}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.badge && item.badge > 0 && (
                        <div className="absolute -top-2 -right-2 bg-construPro-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
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
