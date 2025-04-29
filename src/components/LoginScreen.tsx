
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would authenticate with a backend
    // For now, just navigate to the main app
    navigate('/home');
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
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="link" className="text-sm text-construPro-orange p-0">
                  Esqueci minha senha
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-construPro-orange hover:bg-orange-600 text-white flex items-center justify-center gap-2"
              >
                Entrar <ArrowRight size={18} />
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
          >
            Criar uma conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
