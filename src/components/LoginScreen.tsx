import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import { securityService } from '@/services/securityService';
import { useLogoVariant } from '@/hooks/useLogoVariant';
const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    isAuthenticated,
    isLoading
  } = useAuth();
  const {
    logoVariantUrl,
    isLoading: logoLoading
  } = useLogoVariant();
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname || '/home';
      console.log("User is authenticated. Redirecting to:", from);
      navigate(from, {
        replace: true
      });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError(null);
  };
  const handleLogoError = () => {
    console.log('🚨 [LoginScreen] Erro ao carregar logo variante:', logoVariantUrl);
    setLogoError(true);
  };
  const renderLogo = () => {
    if (logoVariantUrl && !logoError && !logoLoading) {
      return <div className="flex items-center justify-center mb-6">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity" type="button">
            <img src={logoVariantUrl} alt="Matershop" className="h-24 sm:h-32 lg:h-40 w-auto object-contain" onError={handleLogoError} onLoad={() => console.log('✅ [LoginScreen] Logo variante carregada com sucesso!')} />
          </button>
        </div>;
    }

    // Fallback para texto se não houver logo variante ou erro
    return <div className="flex items-center justify-center mb-6">
        <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity" type="button">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black">Matershop</h1>
        </button>
      </div>;
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    try {
      console.log("Attempting login...");

      // Validate session before attempting login
      const sessionValid = await securityService.validateSession();
      if (sessionValid) {
        console.log("User already has valid session");
        navigate('/home');
        return;
      }

      // Call the auth context login function
      const {
        error: loginError
      } = await login(loginData.email, loginData.password);
      if (loginError) {
        console.error("Login error:", loginError);
        setError(loginError.message);

        // Log failed login attempt
        await securityService.logFailedLogin(loginData.email, loginError.message);
        setLoggingIn(false);
        return;
      }

      // Login successful
      console.log("Login successful");
      toast.success("Login realizado com sucesso!");

      // Log successful login (will be called with user ID in auth context)
      await securityService.logSuccessfulLogin('');
    } catch (err) {
      console.error("Login exception:", err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMsg);

      // Log failed login attempt
      await securityService.logFailedLogin(loginData.email, errorMsg);
    } finally {
      setLoggingIn(false);
    }
  };
  const goToSignup = () => {
    navigate('/signup');
  };
  return <div className="min-h-screen flex flex-col bg-white">
      <div className="py-16 rounded-b-3xl relative bg-gray-200">
        {/* Botão de voltar para a página inicial */}
        <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="absolute top-4 left-4 text-white hover:bg-white/10 flex items-center gap-2" type="button">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Voltar ao início</span>
        </Button>
        
        <div className="text-center">
          {renderLogo()}
          <p className="opacity-80 mt-2 text-black">Materiais, clube e recompensas</p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-construPro-blue">Entrar</h2>
          
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>}
          
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                  Email ou CPF
                </label>
                <Input id="email" name="email" type="text" value={loginData.email} onChange={handleChange} placeholder="Seu email ou CPF" className="w-full" required disabled={isLoading || loggingIn} />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} value={loginData.password} onChange={handleChange} placeholder="Sua senha" className="w-full" required disabled={isLoading || loggingIn} />
                  <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" onClick={() => setShowPassword(!showPassword)} disabled={isLoading || loggingIn}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="link" className="text-sm text-construPro-orange p-0" disabled={isLoading || loggingIn} onClick={() => navigate('/recuperar-senha')} type="button">
                  Esqueci minha senha
                </Button>
              </div>

              <Button type="submit" className="w-full bg-construPro-orange hover:bg-orange-600 text-white flex items-center justify-center gap-2" disabled={isLoading || loggingIn}>
                {loggingIn ? <>Entrando...</> : <>Entrar <ArrowRight size={18} /></>}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">Ainda não tem uma conta?</p>
          <Button onClick={goToSignup} variant="link" className="text-construPro-blue font-medium" disabled={isLoading || loggingIn}>
            Criar uma conta
          </Button>
        </div>
      </div>
    </div>;
};
export default LoginScreen;