import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Store, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/sonner";

interface ProfileOptionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

const ProfileOption: React.FC<ProfileOptionProps> = ({
  title,
  description,
  icon,
  selected,
  onClick
}) => {
  return (
    <div
      className={`p-4 rounded-lg border ${selected ? 'border-construPro-blue bg-blue-50' : 'border-gray-200'} cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        {icon}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleProfileSelection = (profile: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    
    try {
      if (selectedProfiles.length === 0) {
        toast.error('Selecione pelo menos um perfil para continuar');
        setLoading(false);
        return;
      }

      // Handle consumer profile
      if (selectedProfiles.includes('consumidor')) {
        navigate('/auth/consumer-profile');
        return;
      }
      
      // Handle vendor profile
      if (selectedProfiles.includes('lojista')) {
        navigate('/auth/vendor-profile', { state: { selectedProfiles } });
        return;
      }
      
      // If we get here, something unexpected happened
      navigate('/home');
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('Erro ao processar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-center mb-8">
          Bem-vindo ao <span className="text-construPro-blue">ConstruPRO</span>
        </h1>
        
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Como você deseja usar o aplicativo?
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Selecione seu perfil principal. Você poderá alterar isso depois.
          </p>
          
          <div className="space-y-4">
            <ProfileOption 
              title="Consumidor"
              description="Compre materiais, acumule pontos e resgate benefícios"
              icon={<User className="h-6 w-6" />}
              selected={selectedProfiles.includes('consumidor')}
              onClick={() => handleProfileSelection('consumidor')}
            />
            
            <ProfileOption 
              title="Lojista"
              description="Venda produtos, gerencie sua loja e alcance novos clientes"
              icon={<Store className="h-6 w-6" />}
              selected={selectedProfiles.includes('lojista')}
              onClick={() => handleProfileSelection('lojista')}
            />
          </div>
          
          <Button
            onClick={handleContinue}
            className="w-full mt-8 bg-construPro-blue hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
