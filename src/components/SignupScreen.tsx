
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check } from 'lucide-react';

const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    senha: '',
    confirmaSenha: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would register the user with a backend
    // For now, just navigate to the login screen
    navigate('/login');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-construPro-blue py-12 px-6 rounded-b-3xl">
        <button onClick={goBack} className="flex items-center text-white mb-4">
          <ArrowLeft size={20} className="mr-1" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">Criar uma conta</h1>
        <p className="text-white opacity-80 mt-1">
          Junte-se ao ConstruPro+ e comece a acumular pontos
        </p>
      </div>

      <div className="p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-600 mb-1">
                Nome completo
              </label>
              <Input
                id="nome"
                name="nome"
                type="text"
                value={signupData.nome}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-600 mb-1">
                CPF/CNPJ
              </label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                value={signupData.cpf}
                onChange={handleChange}
                placeholder="Seu CPF ou CNPJ"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-600 mb-1">
                Telefone
              </label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                value={signupData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={signupData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-600 mb-1">
                Senha
              </label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={signupData.senha}
                onChange={handleChange}
                placeholder="Crie uma senha"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmaSenha" className="block text-sm font-medium text-gray-600 mb-1">
                Confirmar senha
              </label>
              <Input
                id="confirmaSenha"
                name="confirmaSenha"
                type="password"
                value={signupData.confirmaSenha}
                onChange={handleChange}
                placeholder="Confirme sua senha"
                className="w-full"
                required
              />
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="min-w-fit mt-1">
                <div className="h-4 w-4 border border-construPro-orange rounded-sm flex items-center justify-center bg-construPro-orange">
                  <Check size={14} className="text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Concordo com os Termos de Uso e Política de Privacidade do ConstruPro+
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-construPro-orange hover:bg-orange-600 text-white"
            >
              Criar conta
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Já tem uma conta?</p>
          <Button 
            onClick={() => navigate('/login')} 
            variant="link" 
            className="text-construPro-blue font-medium"
          >
            Entrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
