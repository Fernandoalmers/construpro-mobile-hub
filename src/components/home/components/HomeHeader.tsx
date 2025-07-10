
import React from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedAvatar from '@/components/common/EnhancedAvatar';
import OptimizedLogo from '@/components/common/OptimizedLogo';
import { useAuth } from '@/context/AuthContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { getSafeAvatarUrl } from '@/utils/avatarUtils';

const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { logoUrl, isLoading: logoLoading } = useSiteLogo();

  const safeAvatarUrl = getSafeAvatarUrl(profile?.avatar);

  console.log('🖼️ [HomeHeader] Avatar do usuário:', {
    raw: profile?.avatar,
    processed: safeAvatarUrl,
    profileId: profile?.id,
    profileName: profile?.nome
  });

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <OptimizedLogo
              src={logoUrl}
              alt="Matershop"
              className="h-16 sm:h-18 md:h-20 w-auto object-contain hover:scale-105 transition-transform duration-200"
              showSkeleton={logoLoading}
            />
          </div>
          <div className="flex items-center space-x-4">
            <EnhancedAvatar
              src={safeAvatarUrl}
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
