
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const WelcomeSection: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Olá, {profile?.nome || user?.user_metadata?.name || 'Usuário'}!
      </h2>
      <p className="text-gray-600 text-sm">
        Bem-vindo de volta ao seu marketplace de confiança
      </p>
    </div>
  );
};

export default WelcomeSection;
