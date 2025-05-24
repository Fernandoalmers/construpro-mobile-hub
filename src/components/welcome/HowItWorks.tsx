
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ShoppingCart, Star } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Explore produtos e serviços",
      description: "Navegue pelo nosso catálogo completo de materiais de construção e serviços",
      icon: <Search className="w-8 h-8 text-matershop-primary" />
    },
    {
      number: "2", 
      title: "Compre & Pontue automaticamente",
      description: "Faça suas compras e ganhe pontos automaticamente a cada transação",
      icon: <ShoppingCart className="w-8 h-8 text-matershop-primary" />
    },
    {
      number: "3",
      title: "Troque seus pontos por descontos, brindes ou cursos",
      description: "Use seus pontos para obter vantagens exclusivas em nossa plataforma",
      icon: <Star className="w-8 h-8 text-matershop-primary" />
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Como Funciona
          </h2>
          <p className="text-xl text-gray-600">
            Simples, rápido e recompensador
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-matershop-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                </div>
                
                <div className="flex justify-center mb-6 mt-4">
                  {step.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
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
