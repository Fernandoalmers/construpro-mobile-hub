
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from "@/components/ui/sonner";

const SimpleLoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        toast.error("Erro ao fazer login: " + error.message);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate('/home');
    } catch (err) {
      toast.error("Erro inesperado ao fazer login");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Entrar no Matershop
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLogging}
          >
            {isLogging ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate('/signup')}
            >
              Criar uma conta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleLoginScreen;
