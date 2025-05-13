
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import CartPopup from '../marketplace/CartPopup';
import { useNavigationItems } from './navigation/useNavigationItems';
import { useNavigationRoutes } from './navigation/useNavigationRoutes';
import TabMenuItem from './navigation/TabMenuItem';
import NavigationLoadingPlaceholder from './navigation/NavigationLoadingPlaceholder';

const BottomTabNavigator: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const { currentPath, shouldHideNavigation } = useNavigationRoutes();
  
  // User role
  const userRole = profile?.papel || 'consumidor';
  const menuItems = useNavigationItems(userRole);

  // Debug rendering
  React.useEffect(() => {
    console.log("BottomTabNavigator rendering:", { 
      currentPath,
      userRole,
      isAuthenticated: !!user,
      isLoading,
      menuItemsCount: menuItems.length
    });
  }, [currentPath, userRole, user, isLoading, menuItems.length]);
  
  // Show loading placeholder while auth is loading to prevent UI jumps
  if (isLoading) {
    return <NavigationLoadingPlaceholder />;
  }

  // Don't show navigation on certain paths
  if (!user || shouldHideNavigation()) {
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
            {menuItems.map((item, index) => (
              <TabMenuItem 
                key={index}
                name={item.name}
                icon={item.icon}
                path={item.path}
                tooltip={item.tooltip}
                isActive={currentPath === item.path}
                badge={item.badge}
                onClick={handleNavigation}
              />
            ))}
          </div>
        </nav>
      </TooltipProvider>
    </>
  );
};

export default BottomTabNavigator;
