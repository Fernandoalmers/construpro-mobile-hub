import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ChevronLeft, Gift, User, Store, Briefcase } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import CustomInput from './common/CustomInput';
import CustomButton from './common/CustomButton';
import Card from './common/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { referralService } from '@/services/pointsService';

type ProfileType = 'consumidor' | 'lojista' | 'profissional';

interface SignupData {
  email: string;
  password: string;
  nome: string;
  telefone: string;
  tipo_perfil: ProfileType;
  cpf?: string;
  cnpj?: string;
  especialidade_profissional?: string;
  nome_loja?: string;
}

const ESPECIALIDADES_PROFISSIONAIS = [
  'Pedreiro',
  'Eletricista', 
  'Encanador',
  'Pintor',
  'Marceneiro',
  'Soldador',
  'Gesseiro',
  'Azulejista',
  'Serralheiro',
  'Jardineiro',
  'Arquiteto',
  'Engenheiro Civil',
  'Designer de Interiores',
  'Mestre de Obras',
  'Técnico em Segurança do Trabalho',
  'Outros'
];

const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    cnpj: '',
    telefone: '',
    referralCode: '',
    especialidade_profissional: '',
    nome_loja: '',
    tipo_perfil: '' as ProfileType | ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for referral code in localStorage on mount
  useEffect(() => {
    const savedReferralCode = localStorage.getItem('referralCode');
    if (savedReferralCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: savedReferralCode
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
      }
    }
    return cleaned;
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
      }
    }
    return cleaned;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCPF(value);
    setFormData(prev => ({
      ...prev,
      cpf: formattedValue
    }));
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCNPJ(value);
    setFormData(prev => ({
      ...prev,
      cnpj: formattedValue
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatPhone(value);
    setFormData(prev => ({
      ...prev,
      telefone: formattedValue
    }));
  };

  const handleProfileTypeSelect = (tipo: ProfileType) => {
    setFormData(prev => ({
      ...prev,
      tipo_perfil: tipo,
      // Limpar campos quando trocar tipo
      cpf: '',
      cnpj: '',
      especialidade_profissional: '',
      nome_loja: ''
    }));
  };

  const validateCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  };

  const validateCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.length === 14;
  };

  const validateForm = () => {
    if (!formData.tipo_perfil) {
      toast.error('Selecione um tipo de perfil');
      return false;
    }
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    if (!formData.password) {
      toast.error('Senha é obrigatória');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return false;
    }

    // Validação de documento baseada no tipo de perfil
    if (formData.tipo_perfil === 'lojista') {
      if (!formData.cnpj.trim()) {
        toast.error('CNPJ é obrigatório para lojistas');
        return false;
      }
      if (!validateCNPJ(formData.cnpj)) {
        toast.error('CNPJ deve ter 14 dígitos');
        return false;
      }
      if (!formData.nome_loja.trim()) {
        toast.error('Nome da loja é obrigatório para lojistas');
        return false;
      }
    } else {
      if (!formData.cpf.trim()) {
        toast.error('CPF é obrigatório');
        return false;
      }
      if (!validateCPF(formData.cpf)) {
        toast.error('CPF deve ter 11 dígitos');
        return false;
      }
    }

    if (!formData.telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }

    // Validação de especialidade para profissionais
    if (formData.tipo_perfil === 'profissional' && !formData.especialidade_profissional) {
      toast.error('Especialidade é obrigatória para profissionais');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔄 [SignupScreen] Starting signup process with edge function');

      // Preparar dados para o edge function auth-signup
      const signupData: SignupData = {
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        telefone: formData.telefone.replace(/\D/g, ''),
        tipo_perfil: formData.tipo_perfil as ProfileType,
      };

      // Adicionar documento correto baseado no tipo
      if (formData.tipo_perfil === 'lojista') {
        signupData.cnpj = formData.cnpj.replace(/\D/g, '');
        signupData.nome_loja = formData.nome_loja;
      } else {
        signupData.cpf = formData.cpf.replace(/\D/g, '');
      }

      // Adicionar especialidade para profissionais
      if (formData.tipo_perfil === 'profissional' && formData.especialidade_profissional) {
        signupData.especialidade_profissional = formData.especialidade_profissional;
      }

      console.log('📤 [SignupScreen] Calling auth-signup edge function with data:', {
        ...signupData,
        password: '[HIDDEN]'
      });

      // Chamar a edge function auth-signup
      const { data: signupResult, error: signupError } = await supabase.functions.invoke('auth-signup', {
        body: signupData
      });

      console.log('📥 [SignupScreen] Edge function response:', { signupResult, signupError });

      if (signupError) {
        console.error('❌ [SignupScreen] Edge function error:', signupError);
        throw new Error(signupError.message || 'Erro no servidor durante o cadastro');
      }

      if (!signupResult?.success) {
        console.error('❌ [SignupScreen] Signup failed:', signupResult);
        const errorMessage = signupResult?.error || 'Falha no cadastro';
        const errorDetails = signupResult?.details ? ` (${signupResult.details})` : '';
        throw new Error(errorMessage + errorDetails);
      }

      console.log('✅ [SignupScreen] Signup successful:', signupResult);

      // Processar código de referência se fornecido
      if (formData.referralCode.trim() && signupResult.user?.id) {
        console.log('🎁 [SignupScreen] Processing referral code:', formData.referralCode);
        try {
          const referralSuccess = await referralService.processReferral(
            signupResult.user.id, 
            formData.referralCode.trim()
          );
          if (referralSuccess) {
            console.log('✅ [SignupScreen] Referral processed successfully');
            toast.success('Código de referência aplicado! Você ganhará 50 pontos na primeira compra.');
          } else {
            console.warn('⚠️ [SignupScreen] Referral processing failed');
            toast.warning('Código de referência inválido, mas seu cadastro foi realizado com sucesso.');
          }
        } catch (referralError) {
          console.error('❌ [SignupScreen] Referral error:', referralError);
          toast.warning('Erro ao processar código de referência, mas seu cadastro foi realizado com sucesso.');
        }
      }

      // Limpar código de referência do localStorage
      localStorage.removeItem('referralCode');

      // Mostrar código de referência do usuário se disponível
      if (signupResult.referralCode) {
        console.log('🎯 [SignupScreen] User referral code:', signupResult.referralCode);
        toast.success(`Cadastro realizado! Seu código de indicação é: ${signupResult.referralCode}`);
      } else {
        toast.success('Cadastro realizado com sucesso!');
      }

      // Fazer login automático após cadastro bem-sucedido
      console.log('🔐 [SignupScreen] Attempting automatic login');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error('❌ [SignupScreen] Auto-login failed:', loginError);
        toast.info('Cadastro realizado! Faça login para continuar.');
        navigate('/login');
        return;
      }

      if (loginData.session) {
        console.log('✅ [SignupScreen] Auto-login successful');
        
        // Redirecionar baseado no tipo de perfil
        if (formData.tipo_perfil === 'lojista') {
          navigate('/vendor');
        } else if (formData.tipo_perfil === 'profissional') {
          navigate('/services');
        } else {
          navigate('/home');
        }
      } else {
        console.log('📧 [SignupScreen] Email confirmation required');
        toast.info('Confirme seu email para fazer login');
        navigate('/login');
      }

    } catch (error: any) {
      console.error('❌ [SignupScreen] Signup error:', error);
      
      // Tratamento de erros mais específico
      let errorMessage = 'Erro ao criar conta';
      
      if (error.message?.includes('already been registered') || error.message?.includes('already registered')) {
        errorMessage = 'Este email já está cadastrado';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido';
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'Senha deve ter pelo menos 6 caracteres';
      } else if (error.message?.includes('CNPJ é obrigatório')) {
        errorMessage = 'CNPJ é obrigatório para lojistas';
      } else if (error.message?.includes('CPF é obrigatório')) {
        errorMessage = 'CPF é obrigatório';
      } else if (error.message?.includes('Server configuration error')) {
        errorMessage = 'Erro de configuração do servidor. Tente novamente em alguns minutos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearReferralCode = () => {
    setFormData(prev => ({
      ...prev,
      referralCode: ''
    }));
    localStorage.removeItem('referralCode');
    toast.info('Código de referência removido');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="p-6 pt-12 bg-construPro-blue">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="text-white mr-3">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Referral Code Display */}
        {formData.referralCode && (
          <Card className="p-4 mb-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Gift size={20} className="text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Código de convite: {formData.referralCode}
                  </p>
                  <p className="text-xs text-green-600">
                    Você ganhará 50 pontos na primeira compra!
                  </p>
                </div>
              </div>
              <button onClick={clearReferralCode} className="text-green-600 text-sm underline">
                Remover
              </button>
            </div>
          </Card>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Profile Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Escolha seu tipo de perfil</h3>
            <RadioGroup 
              value={formData.tipo_perfil} 
              onValueChange={(value) => handleProfileTypeSelect(value as ProfileType)}
              className="space-y-3"
            >
              {/* Consumidor Option */}
              <div className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                formData.tipo_perfil === 'consumidor'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-muted/10 hover:border-muted-foreground/20'
              }`}>
                <RadioGroupItem value="consumidor" id="consumidor" />
                <User
                  size={24}
                  className={formData.tipo_perfil === 'consumidor' ? 'text-primary' : 'text-muted-foreground'}
                />
                <Label htmlFor="consumidor" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Consumidor</div>
                  <div className="text-sm text-muted-foreground">Para comprar produtos e acumular pontos</div>
                </Label>
              </div>

              {/* Vendedor Option */}
              <div className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                formData.tipo_perfil === 'lojista'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-muted/10 hover:border-muted-foreground/20'
              }`}>
                <RadioGroupItem value="lojista" id="lojista" />
                <Store
                  size={24}
                  className={formData.tipo_perfil === 'lojista' ? 'text-primary' : 'text-muted-foreground'}
                />
                <Label htmlFor="lojista" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Vendedor</div>
                  <div className="text-sm text-muted-foreground">Para vender produtos e gerenciar sua loja</div>
                </Label>
              </div>

              {/* Profissional Option */}
              <div className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                formData.tipo_perfil === 'profissional'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-muted/10 hover:border-muted-foreground/20'
              }`}>
                <RadioGroupItem value="profissional" id="profissional" />
                <Briefcase
                  size={24}
                  className={formData.tipo_perfil === 'profissional' ? 'text-primary' : 'text-muted-foreground'}
                />
                <Label htmlFor="profissional" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Profissional</div>
                  <div className="text-sm text-muted-foreground">Para oferecer serviços especializados</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <CustomInput
            label="Nome completo"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Digite seu nome completo"
            required
          />

          <CustomInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Digite seu email"
            required
          />

          {/* CPF ou CNPJ baseado no tipo de perfil */}
          {formData.tipo_perfil && (
            formData.tipo_perfil === 'lojista' ? (
              <CustomInput
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
              />
            ) : (
              <CustomInput
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            )
          )}

          <CustomInput
            label="Telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            maxLength={15}
            required
          />

          {/* Campo de Nome da Loja para Lojistas */}
          {formData.tipo_perfil === 'lojista' && (
            <CustomInput
              label="Nome da Loja"
              name="nome_loja"
              value={formData.nome_loja}
              onChange={handleInputChange}
              placeholder="Digite o nome da sua loja"
              required
            />
          )}

          {/* Campo de Especialidade para Profissionais */}
          {formData.tipo_perfil === 'profissional' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Especialidade *
              </label>
              <select
                name="especialidade_profissional"
                value={formData.especialidade_profissional}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-construPro-blue focus:border-transparent"
                required
              >
                <option value="">Selecione sua especialidade</option>
                {ESPECIALIDADES_PROFISSIONAIS.map((especialidade) => (
                  <option key={especialidade} value={especialidade}>
                    {especialidade}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Referral Code Input */}
          {!formData.referralCode && (
            <CustomInput
              label="Código de referência (opcional)"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleInputChange}
              placeholder="Digite o código de convite"
            />
          )}

          <div className="relative">
            <CustomInput
              label="Senha"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Digite sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <CustomInput
              label="Confirmar senha"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirme sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <CustomButton
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </CustomButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-construPro-blue font-medium">
              Fazer login
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
