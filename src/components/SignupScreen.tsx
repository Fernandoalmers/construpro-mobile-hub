import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ChevronLeft, Gift, User, Store, Briefcase } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import CustomInput from './common/CustomInput';
import CustomButton from './common/CustomButton';
import Card from './common/Card';
import { referralService } from '@/services/pointsService';
type ProfileType = 'consumidor' | 'lojista' | 'profissional';
const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    telefone: '',
    referralCode: '',
    tipo_perfil: 'consumidor' as ProfileType
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
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
    const {
      value
    } = e.target;
    const formattedValue = formatCPF(value);
    setFormData(prev => ({
      ...prev,
      cpf: formattedValue
    }));
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      value
    } = e.target;
    const formattedValue = formatPhone(value);
    setFormData(prev => ({
      ...prev,
      telefone: formattedValue
    }));
  };
  const handleProfileTypeSelect = (tipo: ProfileType) => {
    setFormData(prev => ({
      ...prev,
      tipo_perfil: tipo
    }));
  };
  const validateForm = () => {
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
    if (!formData.cpf.trim()) {
      toast.error('CPF é obrigatório');
      return false;
    }
    if (!formData.telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    return true;
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      console.log('🔄 [SignupScreen] Starting signup process v2.0');

      // Step 1: Create auth user
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome: formData.nome,
            cpf: formData.cpf.replace(/\D/g, ''),
            telefone: formData.telefone.replace(/\D/g, ''),
            papel: formData.tipo_perfil,
            tipo_perfil: formData.tipo_perfil,
            status: 'ativo',
            saldo_pontos: 0
          }
        }
      });
      if (authError) {
        console.error('❌ [SignupScreen] Auth error:', authError);
        throw authError;
      }
      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }
      console.log('✅ [SignupScreen] User created successfully:', authData.user.id);

      // Step 2: Process referral code if provided
      if (formData.referralCode.trim()) {
        console.log('🎁 [SignupScreen] Processing referral code:', formData.referralCode);
        try {
          const referralSuccess = await referralService.processReferral(authData.user.id, formData.referralCode.trim());
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

      // Step 3: Clear referral code from localStorage
      localStorage.removeItem('referralCode');

      // Step 4: Get user profile to show referral code
      try {
        const {
          data: profile
        } = await supabase.from('profiles').select('codigo').eq('id', authData.user.id).single();
        if (profile?.codigo) {
          console.log('🎯 [SignupScreen] User referral code:', profile.codigo);
          toast.success(`Cadastro realizado! Seu código de indicação é: ${profile.codigo}`);
        } else {
          console.log('✅ [SignupScreen] Cadastro realizado (código será gerado)');
          toast.success('Cadastro realizado com sucesso!');
        }
      } catch (profileError) {
        console.warn('⚠️ [SignupScreen] Não foi possível obter código:', profileError);
        toast.success('Cadastro realizado com sucesso!');
      }
      if (authData.session) {
        console.log('✅ [SignupScreen] User logged in automatically');

        // Redirect based on profile type
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
      if (error.message?.includes('already been registered')) {
        toast.error('Este email já está cadastrado');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Email inválido');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
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
  return <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="p-6 pt-12 bg-black">
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
        {formData.referralCode && <Card className="p-4 mb-4 bg-green-50 border-green-200">
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
          </Card>}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Profile Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Escolha seu tipo de perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Consumidor Card */}
              <Card className={`p-4 cursor-pointer border-2 transition-all ${formData.tipo_perfil === 'consumidor' ? 'border-construPro-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => handleProfileTypeSelect('consumidor')}>
                <div className="flex flex-col items-center text-center">
                  <User size={40} className={`mb-3 ${formData.tipo_perfil === 'consumidor' ? 'text-construPro-blue' : 'text-gray-500'}`} />
                  <h4 className="font-medium text-gray-800 mb-2">Consumidor</h4>
                  <p className="text-sm text-gray-600">
                    Para comprar produtos e acumular pontos
                  </p>
                </div>
              </Card>

              {/* Vendedor Card */}
              <Card className={`p-4 cursor-pointer border-2 transition-all ${formData.tipo_perfil === 'lojista' ? 'border-construPro-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => handleProfileTypeSelect('lojista')}>
                <div className="flex flex-col items-center text-center">
                  <Store size={40} className={`mb-3 ${formData.tipo_perfil === 'lojista' ? 'text-construPro-blue' : 'text-gray-500'}`} />
                  <h4 className="font-medium text-gray-800 mb-2">Vendedor</h4>
                  <p className="text-sm text-gray-600">
                    Para vender produtos e gerenciar sua loja
                  </p>
                </div>
              </Card>

              {/* Profissional Card */}
              <Card className={`p-4 cursor-pointer border-2 transition-all ${formData.tipo_perfil === 'profissional' ? 'border-construPro-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => handleProfileTypeSelect('profissional')}>
                <div className="flex flex-col items-center text-center">
                  <Briefcase size={40} className={`mb-3 ${formData.tipo_perfil === 'profissional' ? 'text-construPro-blue' : 'text-gray-500'}`} />
                  <h4 className="font-medium text-gray-800 mb-2">Profissional</h4>
                  <p className="text-sm text-gray-600">
                    Para oferecer serviços especializados
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <CustomInput label="Nome completo" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Digite seu nome completo" required />

          <CustomInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Digite seu email" required />

          <CustomInput label="CPF" name="cpf" value={formData.cpf} onChange={handleCPFChange} placeholder="000.000.000-00" maxLength={14} required />

          <CustomInput label="Telefone" name="telefone" value={formData.telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength={15} required />

          {/* Optional Referral Code Input */}
          {!formData.referralCode && <CustomInput label="Código de referência (opcional)" name="referralCode" value={formData.referralCode} onChange={handleInputChange} placeholder="Digite o código de convite" />}

          <div className="relative">
            <CustomInput label="Senha" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} placeholder="Digite sua senha" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-500">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <CustomInput label="Confirmar senha" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirme sua senha" required />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-gray-500">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <CustomButton type="submit" variant="primary" fullWidth disabled={isLoading}>
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
    </div>;
};
export default SignupScreen;