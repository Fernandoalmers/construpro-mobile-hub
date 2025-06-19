
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../components/SplashScreen';
import LandingPage from '../components/LandingPage';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [navigate, isAuthenticated, isLoading]);

  // Show loading while checking auth status
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // This shouldn't happen due to useEffect, but just in case
  return <SplashScreen />;
};

export default Index;
