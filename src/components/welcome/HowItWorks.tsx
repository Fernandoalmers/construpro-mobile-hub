
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ShoppingCart, Star } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Explore produtos e serviços",
      description: "Navegue pelo nosso catálogo completo de materiais de construção e serviços",
      icon: <Search className="w-6 h-6 sm:w-8 sm:h-8 text-matershop-primary" />
    },
    {
      number: "2", 
      title: "Compre & Pontue automaticamente",
      description: "Faça suas compras e ganhe pontos automaticamente a cada transação",
      icon: <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-matershop-primary" />
    },
    {
      number: "3",
      title: "Troque seus pontos por descontos, brindes ou cursos",
      description: "Use seus pontos para obter vantagens exclusivas em nossa plataforma",
      icon: <Star className="w-6 h-6 sm:w-8 sm:h-8 text-matershop-primary" />
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Como Funciona
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Simples, rápido e recompensador
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-matershop-primary text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                    {step.number}
                  </div>
                </div>
                
                <div className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-4">
                  {step.icon}
                </div>
                
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  {step.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
