import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Eye, EyeOff, Users } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import type { UserRole } from '../context/AuthContext';
const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    signup
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupData, setSignupData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    codigoIndicacao: '',
    // New field for referral code
    tipo_perfil: 'consumidor' as UserRole
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleTipoPerfilChange = (value: UserRole) => {
    setSignupData(prev => ({
      ...prev,
      tipo_perfil: value
    }));
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (signupData.senha !== signupData.confirmaSenha) {
      toast.error("As senhas não conferem");
      return;
    }
    if (!termsAccepted) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }
    setIsSubmitting(true);
    try {
      // Register the user
      const {
        error
      } = await signup({
        email: signupData.email,
        password: signupData.senha,
        userData: {
          nome: signupData.nome,
          cpf: signupData.cpf,
          telefone: signupData.telefone,
          tipo_perfil: signupData.tipo_perfil,
          codigo_indicacao: signupData.codigoIndicacao // Pass referral code
        }
      });
      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || "Erro ao criar conta");
        setIsSubmitting(false);
        return;
      }
      toast.success("Cadastro realizado com sucesso!");

      // Redirect to profile selection
      navigate('/auth/profile-selection');
    } catch (err) {
      console.error("Unexpected signup error:", err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar conta';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const goBack = () => {
    navigate(-1);
  };
  return <div className="min-h-screen bg-white">
      <div className="bg-construPro-blue py-12 px-6 rounded-b-3xl">
        <button onClick={goBack} className="flex items-center text-white mb-4">
          <ArrowLeft size={20} className="mr-1" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">Criar uma conta</h1>
        <p className="text-white opacity-80 mt-1">Junte-se a Matershop e comece a acumular pontos</p>
      </div>

      <div className="p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-600 mb-1">
                Nome completo
              </label>
              <Input id="nome" name="nome" type="text" value={signupData.nome} onChange={handleChange} placeholder="Seu nome completo" className="w-full" required disabled={isSubmitting} />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-600 mb-1">
                CPF
              </label>
              <Input id="cpf" name="cpf" type="text" value={signupData.cpf} onChange={handleChange} placeholder="Seu CPF" className="w-full" disabled={isSubmitting} />
              <p className="text-xs text-gray-500 mt-1">
                Seu CPF é importante para acumular pontos em compras físicas
              </p>
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-600 mb-1">
                Telefone
              </label>
              <Input id="telefone" name="telefone" type="tel" value={signupData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full" required disabled={isSubmitting} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <Input id="email" name="email" type="email" value={signupData.email} onChange={handleChange} placeholder="seu@email.com" className="w-full" required disabled={isSubmitting} />
            </div>

            {/* New field for referral code */}
            <div>
              <label htmlFor="codigoIndicacao" className="block text-sm font-medium text-gray-600 mb-1">
                Código de indicação (opcional)
              </label>
              <div className="relative">
                <Input id="codigoIndicacao" name="codigoIndicacao" type="text" value={signupData.codigoIndicacao} onChange={handleChange} placeholder="Tem um código? Digite aqui" className="w-full pl-9" disabled={isSubmitting} />
                <Users size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ganhe 100 pontos ao se cadastrar com um código de indicação
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Tipo de perfil
              </label>
              <RadioGroup value={signupData.tipo_perfil} onValueChange={val => handleTipoPerfilChange(val as UserRole)} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="consumidor" id="consumidor" />
                  <label htmlFor="consumidor">Consumidor</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profissional" id="profissional" />
                  <label htmlFor="profissional">Profissional</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vendedor" id="vendedor" />
                  <label htmlFor="vendedor">Vendedor</label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-600 mb-1">
                Senha
              </label>
              <div className="relative">
                <Input id="senha" name="senha" type={showPassword ? "text" : "password"} value={signupData.senha} onChange={handleChange} placeholder="Crie uma senha" className="w-full" required disabled={isSubmitting} />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmaSenha" className="block text-sm font-medium text-gray-600 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <Input id="confirmaSenha" name="confirmaSenha" type={showConfirmPassword ? "text" : "password"} value={signupData.confirmaSenha} onChange={handleChange} placeholder="Confirme sua senha" className="w-full" required disabled={isSubmitting} />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isSubmitting}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="min-w-fit mt-1 cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
                <div className={`h-4 w-4 border rounded-sm flex items-center justify-center ${termsAccepted ? 'border-construPro-orange bg-construPro-orange' : 'border-gray-300'}`}>
                  {termsAccepted && <Check size={14} className="text-white" />}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Concordo com os Termos de Uso e Política de Privacidade do ConstruPro+
              </p>
            </div>

            <Button type="submit" className="w-full mt-6 bg-construPro-orange hover:bg-orange-600 text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Já tem uma conta?</p>
          <Button onClick={() => navigate('/login')} variant="link" className="text-construPro-blue font-medium" disabled={isSubmitting}>
            Entrar
          </Button>
        </div>
      </div>
    </div>;
};
export default SignupScreen;