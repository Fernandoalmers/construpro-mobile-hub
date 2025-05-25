
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingCart, Store } from 'lucide-react';

const BenefitsPillars: React.FC = () => {
  const pillars = [
    {
      title: "Profissionais",
      color: "bg-blue-600",
      textColor: "text-blue-100",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />,
      benefits: [
        "Compare preços com facilidade",
        "Ganhe pontos com compras e indicações",
        "Troque pontos por benefícios reais",
        "Gerencie seus gastos com inteligência"
      ]
    },
    {
      title: "Clientes",
      color: "bg-matershop-success",
      textColor: "text-green-100",
      icon: <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-green-200" />,
      benefits: [
        "Catálogo multiloja com entrega rápida",
        "Cashback em pontos a cada compra",
        "Suporte especializado",
        "App mobile para facilitar compras"
      ]
    },
    {
      title: "Lojistas",
      color: "bg-matershop-warning",
      textColor: "text-orange-100",
      icon: <Store className="w-5 h-5 sm:w-6 sm:h-6 text-orange-200" />,
      benefits: [
        "Venda mais com uma vitrine nacional",
        "Gestão completa em tempo real",
        "Integração com loja física",
        "Consulte nossos planos"
      ]
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Para cada tipo de usuário
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            A Matershop oferece soluções específicas para profissionais, clientes e lojistas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((pillar, index) => (
            <Card key={index} className={`${pillar.color} border-0 overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg`}>
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                    {pillar.icon}
                  </div>
                  <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${pillar.textColor}`}>
                    {pillar.title}
                  </h3>
                </div>
                <ul className="space-y-3 sm:space-y-4">
                  {pillar.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className={`${pillar.textColor} flex items-start`}>
                      <span className="w-2 h-2 rounded-full bg-white mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm sm:text-base leading-relaxed font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsPillars;
