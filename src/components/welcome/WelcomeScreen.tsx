
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

  const handleVendorSignup = () => {
    navigate('/vendor-signup');
  };

  const handleProfessionalSignup = () => {
    navigate('/professional-signup');
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center">
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
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6">
          {/* Logo/Brand */}
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-3">
              MATERSHOP
            </h1>
            <div className="w-24 sm:w-32 h-1 bg-matershop-primary mx-auto"></div>
          </div>
          
          {/* Headlines */}
          <div className="mb-8 sm:mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Tudo para sua obra, com recompensas que constroem valor.
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-medium max-w-3xl mx-auto leading-relaxed">
              Compre de múltiplas lojas, acumule pontos e troque por vantagens exclusivas.
            </p>
          </div>
          
          {/* CTAs - Reorganized for better mobile UX */}
          <div className="mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4">
              <Button 
                onClick={handleCreateAccount}
                style={{ backgroundColor: '#0051FF' }}
                className="w-full sm:w-auto hover:opacity-90 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                Criar conta grátis
              </Button>
              
              <Button 
                onClick={handleVendorSignup}
                variant="outline"
                style={{ borderColor: '#0051FF', color: '#0051FF' }}
                className="w-full sm:w-auto hover:bg-matershop-primary hover:text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300"
                size="lg"
              >
                Sou lojista
              </Button>
            </div>
            
            {/* Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 justify-center items-center">
              <Button 
                onClick={handleLogin}
                variant="link"
                className="text-white hover:text-matershop-primary font-semibold text-sm sm:text-base px-2 py-1 transition-colors duration-300"
              >
                Já sou cadastrado
              </Button>
              
              <Button 
                onClick={handleProfessionalSignup}
                variant="link"
                className="text-white hover:text-matershop-primary font-semibold text-sm sm:text-base px-2 py-1 transition-colors duration-300"
              >
                Sou profissional
              </Button>
            </div>
          </div>
          
          {/* Social Proof - Improved layout */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 text-white">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-xs sm:text-sm">L{i}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-white text-base sm:text-lg font-medium">
              Mais de <span className="text-matershop-primary font-bold">12.000</span> pedidos entregues
            </p>
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
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-matershop-warning to-orange-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Venda mais, fidelize melhor.
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-orange-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Onboarding em 48 horas, suporte comercial dedicado e pague apenas comissão sobre vendas. 
            Expanda seu negócio com nossa plataforma nacional.
          </p>
          
          <Button 
            onClick={handleVendorSignup}
            className="w-full sm:w-auto bg-white text-matershop-warning hover:bg-gray-100 font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            Cadastre sua loja
          </Button>
        </div>
      </section>

      {/* App Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Leve a Matershop com você
              </h2>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Acompanhe seus pontos, gerencie pedidos e aproveite ofertas exclusivas 
                diretamente do seu smartphone.
              </p>
              
              <Button 
                style={{ backgroundColor: '#0051FF' }}
                className="w-full sm:w-auto hover:opacity-90 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                size="lg"
              >
                Baixar App
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 bg-gray-200 rounded-3xl shadow-2xl flex items-center justify-center">
                <span className="text-gray-500 font-medium text-sm sm:text-base">PointsHistoryScreen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-matershop-dark text-white py-8 sm:py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">MATERSHOP</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                O marketplace que recompensa sua obra
              </p>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Links</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Suporte</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trabalhe Conosco</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Newsletter</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-matershop-primary focus:outline-none text-sm"
                />
                <Button 
                  style={{ backgroundColor: '#0051FF' }}
                  className="px-4 py-2 text-sm hover:opacity-90"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 Matershop. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
