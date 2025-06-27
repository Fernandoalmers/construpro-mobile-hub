
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';

const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Smartphone className="h-8 w-8 text-royal-blue mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Matershop</h1>
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
