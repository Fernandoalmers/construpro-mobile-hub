
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLogoVariant } from '@/hooks/useLogoVariant';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { logoVariantUrl, isLoading: logoLoading } = useLogoVariant();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        navigate(isAuthenticated ? '/home' : '/login');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogoError = () => {
    console.log('🚨 [SplashScreen] Erro ao carregar logo variante:', logoVariantUrl);
    setLogoError(true);
  };

  const renderLogo = () => {
    if (logoVariantUrl && !logoError && !logoLoading) {
      return (
        <img
          src={logoVariantUrl}
          alt="Matershop"
          className="h-16 w-auto object-contain mb-6"
          onError={handleLogoError}
          onLoad={() => console.log('✅ [SplashScreen] Logo variante carregada com sucesso!')}
        />
      );
    }

    // Fallback para texto se não houver logo variante ou erro
    return (
      <h1 className="text-4xl font-bold text-white mb-6">
        Matershop
      </h1>
    );
  };

  return (
    <div className="min-h-screen bg-construPro-blue flex flex-col items-center justify-center">
      {renderLogo()}
      <p className="text-white text-lg mb-8">Materiais, clube e recompensas</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
};

export default SplashScreen;
