
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Star, Store } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleVendorSignup = () => {
    navigate('/vendor-signup');
  };

  const benefits = [
    {
      icon: <ShoppingCart className="w-8 h-8 text-yellow-500" />,
      title: "Marketplace Completo",
      description: "Variedade de produtos para sua obra e casa."
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      title: "Programa de Pontos",
      description: "Suas compras viram pontos para trocar por recompensas."
    },
    {
      icon: <Store className="w-8 h-8 text-yellow-500" />,
      title: "Facilidade para Lojistas",
      description: "Venda mais e fidelize clientes em nossa plataforma."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23374151;stop-opacity:1" /><stop offset="100%" style="stop-color:%23111827;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="800" fill="url(%23grad)"/><g opacity="0.1"><circle cx="200" cy="150" r="3" fill="%23FACC15"/><circle cx="800" cy="200" r="2" fill="%23FACC15"/><circle cx="1000" cy="400" r="4" fill="%23FACC15"/><circle cx="300" cy="600" r="2" fill="%23FACC15"/><circle cx="600" cy="700" r="3" fill="%23FACC15"/></g></svg>')`
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Brand */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
                MATERSHOP
              </h1>
              <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4"></div>
            </div>
            
            {/* Main Headline */}
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-6 leading-tight">
              Construa Seus Sonhos, Ganhe Recompensas
            </h2>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              O marketplace completo para seus projetos, onde cada compra te aproxima de vantagens incríveis.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleCreateAccount}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                Criar Conta
              </Button>
              
              <Button 
                onClick={handleLogin}
                variant="outline"
                className="border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-300"
                size="lg"
              >
                Entrar
              </Button>
              
              <Button 
                onClick={handleVendorSignup}
                variant="ghost"
                className="text-gray-300 hover:text-yellow-500 font-medium text-lg px-8 py-4 transition-colors duration-300"
                size="lg"
              >
                Sou Lojista
              </Button>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="px-6 py-16 bg-black bg-opacity-40">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Descubra a Matershop
            </h3>
            <p className="text-gray-300 text-center mb-12 text-lg">
              Por que escolher nossa plataforma?
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-gray-800 bg-opacity-80 border-gray-700 p-8 text-center hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
                  <div className="flex justify-center mb-6">
                    {benefit.icon}
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-4">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center py-8 px-6">
          <p className="text-gray-400 text-sm">
            © 2024 Matershop. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
