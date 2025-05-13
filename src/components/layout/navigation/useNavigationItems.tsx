
import { useMemo } from 'react';
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
import { useCart } from '@/hooks/use-cart';

export interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
  tooltip: string;
  show: (role?: string) => boolean;
  badge?: number;
}

export const useNavigationItems = (userRole?: string) => {
  const { cartCount = 0 } = useCart();

  const menuItems: MenuItem[] = useMemo(() => [
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
      show: (role) => role === 'consumidor' || !role
    },
    { 
      name: 'Carrinho', 
      icon: <ShoppingCart size={24} />, 
      path: '/cart',
      tooltip: 'Ver carrinho de compras',
      badge: cartCount > 0 ? cartCount : undefined,
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
  ], [cartCount]);
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.show(userRole));
  
  return filteredMenuItems;
};
