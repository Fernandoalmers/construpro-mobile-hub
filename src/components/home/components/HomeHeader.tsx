
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';

const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [placeholderError, setPlaceholderError] = useState(false);

  const handleLogoError = () => {
    console.log('Erro ao carregar logo principal');
    setLogoError(true);
  };

  const handlePlaceholderError = () => {
    console.log('Erro ao carregar placeholder');
    setPlaceholderError(true);
  };

  const renderLogo = () => {
    // Se ambas as imagens falharam, mostra logo CSS
    if (logoError && placeholderError) {
      return (
        <div className="h-12 flex items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 cursor-pointer">
            Matershop
          </div>
        </div>
      );
    }

    // Se a logo principal falhou, tenta o placeholder
    if (logoError) {
      return (
        <img
          src="/img/placeholder.png"
          alt="Matershop"
          className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
          onError={handlePlaceholderError}
        />
      );
    }

    // Tenta a nova logo da Matershop primeiro
    return (
      <img
        src="/lovable-uploads/5fbb87ad-f9c8-4314-8317-de0041c02936.png"
        alt="Matershop"
        className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
        onError={handleLogoError}
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
            <Avatar
              src={profile?.avatar}
              alt={profile?.nome || 'Usuario'}
              fallback={profile?.nome}
              size="sm"
              onClick={() => navigate('/profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
