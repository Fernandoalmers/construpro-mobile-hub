
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
              src="/lovable-uploads/31e08fbc-04d4-4249-b2cb-8a9cebdf3107.png"
              alt="Matershop"
              className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
              placeholderClassName="h-12 w-32 bg-gray-200 rounded-md animate-pulse"
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
