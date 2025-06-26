
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    const checkAndSetSession = async () => {
      // Primeiro, tentar obter tokens da URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      
      console.log('URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, error });
      
      // Se há erro na URL (token expirado, etc.)
      if (error) {
        console.error('URL error:', error);
        if (error === 'access_denied' && searchParams.get('error_code') === 'otp_expired') {
          toast.error('Link de recuperação expirado. Solicite um novo link.');
        } else {
          toast.error('Link inválido ou expirado');
        }
        navigate('/recuperar-senha');
        return;
      }

      // Se não temos os tokens necessários, verificar se há uma sessão ativa
      if (!accessToken || !refreshToken) {
        console.log('No tokens in URL, checking current session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Erro ao verificar sessão. Solicite um novo link.');
          navigate('/recuperar-senha');
          return;
        }
        
        if (session) {
          console.log('Found active session');
          setIsValidToken(true);
        } else {
          console.log('No active session found');
          toast.error('Link inválido ou expirado. Solicite um novo link.');
          navigate('/recuperar-senha');
          return;
        }
      } else {
        // Temos tokens, vamos configurar a sessão
        console.log('Setting session with tokens from URL...');
        
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Set session error:', setSessionError);
            
            if (setSessionError.message.includes('expired')) {
              toast.error('Link de recuperação expirado. Solicite um novo link.');
            } else {
              toast.error('Link inválido. Solicite um novo link.');
            }
            navigate('/recuperar-senha');
            return;
          }
          
          if (data?.session) {
            console.log('Session set successfully');
            setIsValidToken(true);
          } else {
            console.log('No session returned');
            toast.error('Erro ao validar link. Solicite um novo link.');
            navigate('/recuperar-senha');
            return;
          }
        } catch (error) {
          console.error('Unexpected error setting session:', error);
          toast.error('Erro inesperado. Solicite um novo link.');
          navigate('/recuperar-senha');
          return;
        }
      }
      
      setIsCheckingToken(false);
    };

    checkAndSetSession();
  }, [searchParams, navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        
        if (error.message.includes('session_not_found')) {
          toast.error('Sessão expirada. Solicite um novo link de recuperação.');
          navigate('/recuperar-senha');
        } else {
          toast.error('Erro ao redefinir senha. Tente novamente.');
        }
      } else {
        toast.success('Senha redefinida com sucesso!');
        setPasswordReset(true);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Link inválido ou expirado</p>
          <Button 
            onClick={() => navigate('/recuperar-senha')}
            className="bg-construPro-blue hover:bg-construPro-blue-dark text-white"
          >
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-construPro-blue py-16 rounded-b-3xl">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center text-white mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} className="mr-1" /> Ir para login
          </button>
          <h1 className="text-2xl font-bold text-white">
            {passwordReset ? 'Senha redefinida!' : 'Nova senha'}
          </h1>
          <p className="text-white opacity-80 mt-2">
            {passwordReset 
              ? 'Agora você pode fazer login com sua nova senha' 
              : 'Digite sua nova senha'
            }
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {!passwordReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                  Nova senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-construPro-orange hover:bg-orange-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Senha redefinida com sucesso!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Sua senha foi alterada. Você será redirecionado para o login em alguns segundos.
              </p>
              
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-construPro-blue hover:bg-construPro-blue-dark text-white"
              >
                Ir para login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
