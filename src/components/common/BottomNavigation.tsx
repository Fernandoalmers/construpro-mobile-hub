
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, LayoutDashboard, Gift } from 'lucide-react';
import NavItem from './NavItem';
import { useAuth } from '@/context/AuthContext';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  
  // Simple hook to check if mobile
  const isMobile = window.innerWidth <= 640;

  // Do not render on desktop or certain pages
  if (!isMobile || location.pathname.includes('/auth/') || 
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/welcome' ||
      location.pathname === '/onboarding') {
    return null;
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
