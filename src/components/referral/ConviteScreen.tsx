
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Gift, Users, Award } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '../../context/AuthContext';

const ConviteScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');

  useEffect(() => {
    // Pegar o código de referência da URL
    const codigo = searchParams.get('codigo');
    if (codigo) {
      setReferralCode(codigo);
      // Salvar no localStorage para usar no cadastro
      localStorage.setItem('referralCode', codigo);
    }
  }, [searchParams]);

  const handleSignup = () => {
    // Se já estiver logado, mostrar mensagem
    if (isAuthenticated) {
      toast.info('Você já está logado! O código de referência não pode ser aplicado.');
      navigate('/home');
      return;
    }

    // Redirecionar para cadastro
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Convite Especial</h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Welcome Card */}
        <Card className="p-6 mb-6 text-center">
          <div className="mb-4">
            <Gift size={48} className="text-construPro-orange mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Você foi convidado!
            </h2>
            {referralCode && (
              <div className="bg-construPro-blue text-white px-4 py-2 rounded-lg inline-block mb-3">
                <span className="text-sm">Código de convite:</span>
                <div className="text-lg font-bold">{referralCode}</div>
              </div>
            )}
            <p className="text-gray-600">
              Cadastre-se na Matershop usando este convite e ganhe pontos na sua primeira compra!
            </p>
          </div>
        </Card>

        {/* Benefits */}
        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-gray-800">Benefícios do convite:</h3>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Award size={24} className="text-construPro-orange mr-3" />
              <div>
                <p className="font-medium">20 pontos para você</p>
                <p className="text-sm text-gray-600">Receba pontos na sua primeira compra</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Users size={24} className="text-construPro-orange mr-3" />
              <div>
                <p className="font-medium">20 pontos para quem te indicou</p>
                <p className="text-sm text-gray-600">Seu amigo também ganha pontos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* How it works */}
        <Card className="p-4 mb-6">
          <h3 className="font-medium mb-3">Como funciona:</h3>
          <ol className="space-y-3">
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                1
              </div>
              <p className="text-sm">Cadastre-se na Matershop com este convite</p>
            </li>
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                2
              </div>
              <p className="text-sm">Faça sua primeira compra</p>
            </li>
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                3
              </div>
              <p className="text-sm">Receba 20 pontos automaticamente</p>
            </li>
          </ol>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isAuthenticated ? (
            <CustomButton 
              variant="primary" 
              fullWidth 
              onClick={() => navigate('/home')}
            >
              Ir para o Marketplace
            </CustomButton>
          ) : (
            <>
              <CustomButton 
                variant="primary" 
                fullWidth 
                onClick={handleSignup}
              >
                Cadastrar e Ganhar Pontos
              </CustomButton>
              
              <CustomButton 
                variant="outline" 
                fullWidth 
                onClick={handleLogin}
              >
                Já tenho conta - Fazer Login
              </CustomButton>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Os pontos serão creditados automaticamente após sua primeira compra.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConviteScreen;
