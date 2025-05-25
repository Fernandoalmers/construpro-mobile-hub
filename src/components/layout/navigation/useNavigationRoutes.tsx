
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigationRoutes = () => {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState('');
  
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

  // Check if navigation should be hidden on certain paths
  const shouldHideNavigation = () => {
    return !location.pathname || 
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/onboarding' || 
      location.pathname === '/splash' ||
      location.pathname.startsWith('/admin');
  };

  return { currentPath, shouldHideNavigation };
};
