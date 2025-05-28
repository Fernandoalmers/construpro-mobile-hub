
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './imports';
import BottomTabNavigator from './components/layout/BottomTabNavigator';
import LoadingState from './components/common/LoadingState';
import { NotFoundScreen } from './routes/RouteImports';
import { shouldShowBottomNavigation } from './utils/navigationUtils';

// Route components
import PublicRoutes from './routes/PublicRoutes';
import AuthRoutes from './routes/AuthRoutes';
import UserRoutes from './routes/UserRoutes';
import VendorRoutes from './routes/VendorRoutes';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  const location = useLocation();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  // Wait for auth to be checked before rendering app
  useEffect(() => {
    if (!isLoading) {
      setAppReady(true);
    }
  }, [isLoading]);

  // Debug routes and auth status
  useEffect(() => {
    console.log("App rendering. Path:", location.pathname, "Auth:", isAuthenticated, "Loading:", isLoading);
  }, [location.pathname, isAuthenticated, isLoading]);

  // Show loading state while authentication is being checked
  if (!appReady) {
    return <LoadingState text="Carregando aplicativo..." />;
  }

  return (
    <CartProvider>
      <Routes>
        {/* Public routes */}
        <PublicRoutes />
        
        {/* Authentication flow routes */}
        <AuthRoutes />
        
        {/* Protected user routes */}
        <UserRoutes />
        
        {/* Vendor routes */}
        <VendorRoutes />
        
        {/* Admin routes */}
        <AdminRoutes />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      
      {shouldShowBottomNavigation(location.pathname) && <BottomTabNavigator />}
    </CartProvider>
  );
}

export default App;
