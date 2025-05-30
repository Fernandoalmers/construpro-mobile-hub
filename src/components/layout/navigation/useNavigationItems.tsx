
import React from 'react';
import { Home, ShoppingBag, LayoutDashboard, Package, User, Gift, ShoppingCart, Settings } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

// Define the type for navigation items
export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  tooltip: string;
  badge?: string;
}

export function useNavigationItems(userRole: string): NavigationItem[] {
  const { cart } = useCart();

  // Calculate count from actual cart items for consistency
  const actualCartCount = React.useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  }, [cart?.items]);

  console.log('[useNavigationItems] userRole:', userRole, 'actualCartCount:', actualCartCount);

  // Common navigation items for all users
  const commonItems: NavigationItem[] = [
    {
      name: 'Home',
      path: '/home',
      icon: <Home size={24} />,
      tooltip: 'Home'
    },
    {
      name: 'Marketplace',
      path: '/marketplace',
      icon: <ShoppingBag size={24} />,
      tooltip: 'Marketplace'
    }
  ];

  // Navigation items specific to vendors
  const vendorItems: NavigationItem[] = [
    ...commonItems,
    {
      name: 'Vendas',
      path: '/vendor',
      icon: <LayoutDashboard size={24} />,
      tooltip: 'Portal do Vendedor'
    },
    {
      name: 'Produtos',
      path: '/vendor/products',
      icon: <Package size={24} />,
      tooltip: 'Gerenciar Produtos'
    },
    {
      name: 'Perfil',
      path: '/profile',
      icon: <User size={24} />,
      tooltip: 'Perfil'
    }
  ];

  // Navigation items specific to consumers
  const consumerItems: NavigationItem[] = [
    ...commonItems,
    {
      name: 'Recompensas',
      path: '/rewards',
      icon: <Gift size={24} />,
      tooltip: 'Recompensas'
    },
    {
      name: 'Carrinho',
      path: '/cart',
      icon: <ShoppingCart size={24} />,
      tooltip: 'Meu Carrinho',
      badge: actualCartCount > 0 ? actualCartCount.toString() : undefined
    },
    {
      name: 'Perfil',
      path: '/profile',
      icon: <User size={24} />,
      tooltip: 'Perfil'
    }
  ];

  // Admin specific items
  const adminItems: NavigationItem[] = [
    ...commonItems,
    {
      name: 'Admin',
      path: '/admin',
      icon: <Settings size={24} />,
      tooltip: 'Admin'
    },
    {
      name: 'Perfil',
      path: '/profile',
      icon: <User size={24} />,
      tooltip: 'Perfil'
    }
  ];

  // Return the appropriate items based on user role
  if (userRole === 'admin') {
    return adminItems;
  } else if (userRole === 'lojista') {
    return vendorItems;
  } else {
    return consumerItems;
  }
}
