
import React from 'react';
import { Search, ShoppingCart, Star } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Explore produtos e serviços",
      description: "Navegue pelo nosso catálogo completo de materiais de construção e serviços",
      icon: <Search className="w-8 h-8 sm:w-10 sm:h-10 text-matershop-primary" />
    },
    {
      number: "2", 
      title: "Compre & Pontue automaticamente",
      description: "Faça suas compras e ganhe pontos automaticamente a cada transação",
      icon: <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-matershop-primary" />
    },
    {
      number: "3",
      title: "Troque seus pontos por descontos, brindes ou cursos",
      description: "Use seus pontos para obter vantagens exclusivas em nossa plataforma",
      icon: <Star className="w-8 h-8 sm:w-10 sm:h-10 text-matershop-primary" />
    }
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Como Funciona
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Simples, rápido e recompensador
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16 md:space-y-20">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
              {/* Step Number and Icon */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-matershop-primary rounded-full text-white font-bold text-2xl sm:text-3xl mb-4">
                  {step.number}
                </div>
                <div className="flex justify-center lg:justify-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center lg:text-left max-w-2xl">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {/* Connector Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block w-px h-24 bg-gray-200 mx-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
