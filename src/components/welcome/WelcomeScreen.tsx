
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
      <section className="relative min-h-[70vh] sm:min-h-[75vh] flex items-center justify-center">
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
          
          {/* CTAs - Simplificados */}
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
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-matershop-dark font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-lg transition-all duration-300"
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

      {/* For Vendors Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-r from-matershop-warning to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            Venda mais, fidelize melhor.
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-orange-100 mb-4 sm:mb-6 max-w-xl mx-auto leading-relaxed">
            Onboarding em 48 horas, suporte comercial dedicado e pague apenas comissão sobre vendas. 
            Expanda seu negócio com nossa plataforma nacional.
          </p>
          
          <Button 
            onClick={() => navigate('/vendor-signup')}
            className="w-full sm:w-auto bg-white text-matershop-warning hover:bg-gray-100 font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            Cadastre sua loja
          </Button>
        </div>
      </section>

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
                style={{ backgroundColor: '#0051FF' }}
                className="w-full sm:w-auto hover:opacity-90 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3"
                size="lg"
              >
                Baixar App
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-80 bg-gray-200 rounded-3xl shadow-xl flex items-center justify-center">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">PointsHistoryScreen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-matershop-dark text-white py-8 sm:py-10 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">MATERSHOP</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                O marketplace que recompensa sua obra
              </p>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Links</h4>
              <ul className="space-y-1 text-gray-400 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Suporte</h4>
              <ul className="space-y-1 text-gray-400 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trabalhe Conosco</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Newsletter</h4>
              <div className="flex flex-col gap-2">
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-matershop-primary focus:outline-none text-xs sm:text-sm"
                />
                <Button 
                  style={{ backgroundColor: '#0051FF' }}
                  className="px-4 py-2 text-xs sm:text-sm hover:opacity-90"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-4 sm:pt-6 text-center text-gray-400 text-xs sm:text-sm">
            <p>&copy; 2024 Matershop. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
