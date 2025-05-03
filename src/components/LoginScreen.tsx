
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from "@/components/ui/sonner";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Use the state from location if available, otherwise go to home
      const from = location.state?.from?.pathname || '/home';
      console.log("User is authenticated. Redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    
    try {
      // Call the auth context login function
      const { error } = await login(loginData.email, loginData.password);
      
      if (error) {
        console.error("Login error:", error);
        setError(error.message);
        setLoggingIn(false);
        return;
      }
      
      // Login successful, navigate is handled by useEffect
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      console.error("Login exception:", err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMsg);
    } finally {
      setLoggingIn(false);
    }
  };

  const goToSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-construPro-blue py-16 rounded-b-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ConstruPro+</h1>
          <p className="text-white opacity-80 mt-2">
            Materiais, serviços e recompensas
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-construPro-blue">Entrar</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                  Email ou CPF
                </label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  value={loginData.email}
                  onChange={handleChange}
                  placeholder="Seu email ou CPF"
                  className="w-full"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    className="w-full"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="link" 
                  className="text-sm text-construPro-orange p-0"
                  disabled={isLoading}
                  onClick={() => navigate('/recuperar-senha')}
                  type="button"
                >
                  Esqueci minha senha
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-construPro-orange hover:bg-orange-600 text-white flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Entrando...</>
                ) : (
                  <>Entrar <ArrowRight size={18} /></>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">Ainda não tem uma conta?</p>
          <Button 
            onClick={goToSignup} 
            variant="link" 
            className="text-construPro-blue font-medium"
            disabled={isLoading}
          >
            Criar uma conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
