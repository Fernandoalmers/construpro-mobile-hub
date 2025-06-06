
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Store, User, Wrench } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import { UserRole } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';

interface ProfileOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ProfileSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile, user, profile, isAuthenticated, isLoading } = useAuth();
  const [selectedProfiles, setSelectedProfiles] = useState<UserRole[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is not authenticated, redirect to login
      navigate('/login', { state: { from: { pathname: '/auth/profile-selection' } } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const profileOptions: ProfileOption[] = [
    {
      id: 'consumidor',
      title: 'Comprador',
      description: 'Quero comprar produtos e ganhar pontos',
      icon: <User size={24} className="text-construPro-blue" />,
    },
    {
      id: 'profissional',
      title: 'Profissional',
      description: 'Sou profissional da construção civil',
      icon: <Wrench size={24} className="text-construPro-blue" />,
    },
    {
      id: 'lojista',
      title: 'Lojista',
      description: 'Tenho uma loja e quero vender',
      icon: <Store size={24} className="text-construPro-blue" />,
    },
  ];

  const handleProfileToggle = (profileId: UserRole) => {
    setSelectedProfiles(prev => {
      return prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId];
    });
  };

  const handleContinue = async () => {
    if (selectedProfiles.length === 0) {
      toast.error("Por favor, selecione pelo menos um perfil para continuar");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the profile-update edge function instead of direct table update
      await updateProfile({ 
        papel: selectedProfiles[0],
        tipo_perfil: selectedProfiles[0]
      });
      
      toast.success("Perfil atualizado com sucesso!");
      
      if (selectedProfiles.includes('profissional') && selectedProfiles.includes('lojista')) {
        navigate('/auth/complete-profile', { 
          state: { selectedProfiles }
        });
      } else if (selectedProfiles.includes('profissional')) {
        navigate('/auth/professional-profile');
      } else if (selectedProfiles.includes('lojista')) {
        navigate('/auth/vendor-profile');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Ocorreu um erro. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while authentication status is being determined
  if (isLoading) {
    return <LoadingState text="Verificando autenticação..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-construPro-blue py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-bold text-white">Bem-vindo ao ConstruPro+</h1>
          <p className="text-white opacity-80 mt-2">
            Como deseja usar o aplicativo?
          </p>
          <p className="text-white opacity-70 mt-1 text-sm">
            * Selecione pelo menos uma opção para continuar
          </p>
        </div>
      </div>

      <div className="flex-grow p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {selectedProfiles.length === 0 && (
            <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
              <p className="text-orange-800 text-sm font-medium">
                ⚠️ Por favor, selecione pelo menos um perfil para continuar
              </p>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            {profileOptions.map(option => (
              <div
                key={option.id}
                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                  selectedProfiles.includes(option.id)
                    ? 'border-construPro-blue bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleProfileToggle(option.id)}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <div className="ml-2">
                    <Checkbox
                      checked={selectedProfiles.includes(option.id)}
                      className={selectedProfiles.includes(option.id) ? "text-construPro-blue border-construPro-blue" : ""}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-6">
            💡 Você pode selecionar mais de uma opção e alternar entre os perfis depois.
          </p>

          <Button 
            onClick={handleContinue}
            className={`w-full text-white transition-all ${
              selectedProfiles.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-construPro-orange hover:bg-orange-600'
            }`}
            disabled={isSubmitting || selectedProfiles.length === 0}
          >
            {isSubmitting ? 'Processando...' : 
             selectedProfiles.length === 0 ? 'Selecione um perfil para continuar' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionScreen;
