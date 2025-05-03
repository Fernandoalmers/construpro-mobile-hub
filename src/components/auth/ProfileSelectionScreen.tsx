
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
  const [selectedProfiles, setSelectedProfiles] = useState<UserRole[]>(['consumidor']);
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
      // Always keep consumidor profile
      if (profileId === 'consumidor') return prev;
      
      return prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId];
    });
  };

  const handleContinue = async () => {
    if (selectedProfiles.length === 0) {
      toast.error("Selecione pelo menos um perfil");
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
        </div>
      </div>

      <div className="flex-grow p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4 mb-6">
            {profileOptions.map(option => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  selectedProfiles.includes(option.id)
                    ? 'border-construPro-blue bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProfileToggle(option.id)}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <div className="ml-2">
                    {option.id === 'consumidor' ? (
                      <div className="h-5 w-5 rounded-sm border border-construPro-blue bg-construPro-blue flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <Checkbox
                        checked={selectedProfiles.includes(option.id)}
                        className={selectedProfiles.includes(option.id) ? "text-construPro-blue" : ""}
                        onCheckedChange={() => {}}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Você pode selecionar mais de uma opção e alternar entre os perfis depois.
          </p>

          <Button 
            onClick={handleContinue}
            className="w-full bg-construPro-orange hover:bg-orange-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionScreen;
