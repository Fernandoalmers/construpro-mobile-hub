
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedAvatar from '@/components/common/EnhancedAvatar';
import { useAuth } from '@/context/AuthContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { logoUrl, isLoading: logoLoading } = useSiteLogo();
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = () => {
    console.log('🚨 [HomeHeader] Erro ao carregar logo:', logoUrl);
    setLogoError(true);
  };

  const renderLogo = () => {
    console.log('🔍 [HomeHeader] Estado atual:', { logoUrl, logoError, logoLoading });
    
    // Determinar qual logo usar - prioridade: logo do banco de dados ou logo padrão
    const currentLogoUrl = logoUrl && !logoError 
      ? logoUrl 
      : '/lovable-uploads/7520caa6-efbb-4176-9c9f-8d37f88c7ff1.png';
    
    console.log('✅ [HomeHeader] Carregando logo:', currentLogoUrl);
    
    return (
      <img
        src={currentLogoUrl}
        alt="Matershop"
        className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
        onError={handleLogoError}
        onLoad={() => console.log('🎉 [HomeHeader] Logo carregada com sucesso!')}
      />
    );
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {renderLogo()}
          </div>
          <div className="flex items-center space-x-4">
            <EnhancedAvatar
              src={profile?.avatar}
              alt={profile?.nome || 'Usuario'}
              fallback={profile?.nome}
              size="sm"
              onClick={() => navigate('/profile')}
              showLoadingIndicator={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
