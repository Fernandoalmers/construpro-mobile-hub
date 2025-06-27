
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import LazyImage from '@/components/common/LazyImage';
import { useAuth } from '@/context/AuthContext';

const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LazyImage
              src="/matershop-logo.png"
              alt="Matershop"
              className="h-10 w-auto object-contain"
              placeholderClassName="h-10 w-24 bg-gray-200 rounded"
              onError={() => console.log('Erro ao carregar logo')}
            />
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
