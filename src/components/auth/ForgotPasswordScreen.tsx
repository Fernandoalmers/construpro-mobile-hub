
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';

const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, informe seu email");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, informe um email válido");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Usar /verify como redirect URL que o Supabase espera
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/verify`,
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // Tratamento de erros específicos
        if (error.message.includes('Email not confirmed')) {
          toast.error("Email não confirmado. Verifique sua caixa de entrada e confirme seu email primeiro.");
        } else if (error.message.includes('User not found')) {
          // Por segurança, não revelamos se o email existe ou não
          toast.success("Se o email estiver cadastrado, você receberá instruções para redefinir sua senha");
          setEmailSent(true);
        } else {
          toast.error("Erro ao enviar email de recuperação. Tente novamente.");
        }
      } else {
        toast.success("Email de recuperação enviado com sucesso!");
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-construPro-blue py-16 rounded-b-3xl">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-white mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} className="mr-1" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">
            {emailSent ? 'Email enviado!' : 'Recuperar senha'}
          </h1>
          <p className="text-white opacity-80 mt-2">
            {emailSent 
              ? 'Verifique sua caixa de entrada' 
              : 'Digite seu email para receber instruções'
            }
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu email cadastrado"
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-construPro-orange hover:bg-orange-600 text-white flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>Enviar link de recuperação <Send size={18} /></>
                )}
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
                Email enviado com sucesso!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Se o email <strong>{email}</strong> estiver cadastrado em nossa plataforma, 
                você receberá um link para redefinir sua senha em alguns minutos.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full bg-construPro-blue hover:bg-construPro-blue-dark text-white"
                >
                  Voltar ao login
                </Button>
                
                <p className="text-sm text-gray-500">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
