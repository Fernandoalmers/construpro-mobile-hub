
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
        "Pague apenas comissão sobre vendas"
      ]
    }
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
            Para cada tipo de usuário
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            A Matershop oferece soluções específicas para profissionais, clientes e lojistas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {pillars.map((pillar, index) => (
            <Card key={index} className={`${pillar.color} border-0 overflow-hidden hover:scale-105 transition-transform duration-300`}>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  {pillar.icon}
                  <h3 className={`text-base sm:text-lg md:text-xl font-bold ml-2 sm:ml-3 ${pillar.textColor}`}>
                    {pillar.title}
                  </h3>
                </div>
                <ul className="space-y-2 sm:space-y-3">
                  {pillar.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className={`${pillar.textColor} flex items-start`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 mr-2 flex-shrink-0"></span>
                      <span className="text-xs sm:text-sm leading-relaxed">{benefit}</span>
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
