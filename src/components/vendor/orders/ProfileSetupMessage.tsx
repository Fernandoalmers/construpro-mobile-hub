
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Store } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import OrdersHeader from './OrdersHeader';

interface ProfileSetupMessageProps {
  onBack: () => void;
}

const ProfileSetupMessage: React.FC<ProfileSetupMessageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <OrdersHeader 
        onBack={onBack} 
        onRefresh={() => {}} 
        isRefetching={false} 
      />
      
      <div className="p-6 flex flex-col items-center justify-center flex-grow">
        <Card className="p-6 max-w-md w-full text-center">
          <Store size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Configure seu perfil de vendedor</h2>
          <p className="text-gray-600 mb-6">
            Você precisa configurar seu perfil de vendedor para poder acessar e gerenciar seus pedidos.
          </p>
          <Button 
            onClick={() => navigate('/auth/vendor-profile')}
            className="w-full bg-construPro-blue hover:bg-blue-700 mb-4"
          >
            Configurar Perfil
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => {
              toast.info('Alternando para modo consumidor');
              navigate('/profile');
            }}
          >
            Voltar para Perfil
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupMessage;
