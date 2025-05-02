
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { toast } from "@/components/ui/sonner";

const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, informe seu email");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Enviamos um email com instruções para redefinir sua senha");
      navigate('/login');
    } catch (error) {
      toast.error("Não foi possível enviar o email. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-construPro-blue py-16 rounded-b-3xl">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-white mb-4"
          >
            <ArrowLeft size={20} className="mr-1" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="text-white opacity-80 mt-2">
            Digite seu email para receber instruções
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
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
                  placeholder="Seu email"
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enviaremos um email com instruções para redefinir sua senha.
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
                <>Enviar instruções <Send size={18} /></>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
