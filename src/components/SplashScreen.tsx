
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLogoVariant } from '@/hooks/useLogoVariant';
import OptimizedLogo from '@/components/common/OptimizedLogo';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { logoVariantUrl, isLoading: logoLoading } = useLogoVariant();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        navigate(isAuthenticated ? '/home' : '/login');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-construPro-blue flex flex-col items-center justify-center">
      {logoVariantUrl ? (
        <OptimizedLogo
          src={logoVariantUrl}
          alt="Matershop"
          className="h-16 w-auto object-contain mb-6"
          showSkeleton={logoLoading}
          fallbackSrc={null} // Usar fallback de texto se não houver logo variante
        />
      ) : (
        <h1 className="text-4xl font-bold text-white mb-6">
          Matershop
        </h1>
      )}
      <p className="text-white text-lg mb-8">Materiais, clube e recompensas</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
};

export default SplashScreen;
