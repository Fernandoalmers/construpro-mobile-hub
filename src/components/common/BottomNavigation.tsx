
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, LayoutDashboard, Gift } from 'lucide-react';
import NavItem from './NavItem';
import { useAuth } from '@/context/AuthContext';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();
  
  // Simple hook to check if mobile
  const isMobile = window.innerWidth <= 640;

  // Debug rendering
  React.useEffect(() => {
    console.log("BottomNavigation rendering:", { 
      path: location.pathname,
      isMobile,
      profile: profile?.papel,
      isLoading
    });
  }, [location.pathname, profile, isLoading]);

  // Don't render on desktop or certain pages
  if (!isMobile || 
      location.pathname.includes('/auth/') || 
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/welcome' ||
      location.pathname === '/onboarding' ||
      location.pathname.startsWith('/admin')) {
    return null;
  }

  // Show loading placeholder while auth is loading to prevent UI jumps
  if (isLoading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center py-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full mb-1"></div>
              <div className="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  const isActive = (path: string | string[]) => {
    if (Array.isArray(path)) {
      return path.some(p => location.pathname.startsWith(p));
    }
    return location.pathname.startsWith(path);
  };

  // Determine if user is a vendor
  const isVendor = profile?.papel === 'lojista' || profile?.tipo_perfil === 'lojista';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
      <div className="grid grid-cols-5 gap-1">
        <NavItem 
          to="/home" 
          icon={<Home size={20} />} 
          label="Início" 
          isActive={location.pathname === "/" || location.pathname === "/home"} 
        />
        <NavItem 
          to="/search" 
          icon={<Search size={20} />} 
          label="Buscar" 
          isActive={isActive('/search')} 
        />
        <NavItem 
          to={isVendor ? "/vendor-dashboard" : "/rewards"} 
          icon={isVendor ? <LayoutDashboard size={20} /> : <Gift size={20} />} 
          label={isVendor ? "Vendas" : "Recompensas"} 
          isActive={isVendor ? isActive('/vendor') : isActive('/rewards')} 
        />
        <NavItem 
          to="/orders" 
          icon={<ShoppingBag size={20} />} 
          label="Pedidos" 
          isActive={isActive('/orders')} 
        />
        <NavItem 
          to="/profile" 
          icon={<User size={20} />} 
          label="Perfil" 
          isActive={isActive('/profile')} 
        />
      </div>
    </nav>
  );
};

export default BottomNavigation;
