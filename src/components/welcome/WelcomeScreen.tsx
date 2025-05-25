
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BenefitsPillars from './BenefitsPillars';
import HowItWorks from './HowItWorks';
import DynamicHighlights from './DynamicHighlights';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[65vh] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-matershop-dark bg-opacity-60" />
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
          {/* Logo/Brand */}
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-2 sm:mb-3">
              MATERSHOP
            </h1>
            <div className="w-20 sm:w-24 md:w-28 h-1 bg-matershop-primary mx-auto"></div>
          </div>
          
          {/* Headlines */}
          <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Tudo para sua obra, com recompensas que constroem valor.
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed">
              Compre de múltiplas lojas, acumule pontos e troque por vantagens exclusivas.
            </p>
          </div>
          
          {/* CTAs */}
          <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button 
                onClick={handleCreateAccount}
                style={{ backgroundColor: '#0051FF' }}
                className="w-full sm:w-auto hover:opacity-90 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                Criar conta grátis
              </Button>
              
              <Button 
                onClick={handleLogin}
                variant="outline"
                className="w-full sm:w-auto border-2 border-white bg-transparent text-white hover:bg-white hover:text-matershop-dark font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-lg transition-all duration-300"
                size="lg"
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <BenefitsPillars />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Dynamic Highlights Section */}
      <DynamicHighlights />

      {/* App Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Leve a Matershop com você
              </h2>
              
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                Acompanhe seus pontos, gerencie pedidos e aproveite ofertas exclusivas 
                diretamente do seu smartphone.
              </p>
              
              <Button 
                onClick={handleCreateAccount}
                style={{ backgroundColor: '#0051FF' }}
                className="w-full sm:w-auto hover:opacity-90 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3"
                size="lg"
              >
                Criar conta grátis
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-80 bg-gray-200 rounded-3xl shadow-xl flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                  <div className="text-xs">App Matershop</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-matershop-dark text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2025 Matershop. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
