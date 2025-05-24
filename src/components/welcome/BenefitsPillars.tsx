
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingCart, Store } from 'lucide-react';

const BenefitsPillars: React.FC = () => {
  const pillars = [
    {
      title: "Profissionais",
      color: "bg-blue-600",
      textColor: "text-blue-100",
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />,
      benefits: [
        "Orçamentos em 1 clique: encontre preços competitivos",
        "Pontos extras por indicação",
        "Carteira digital para resgate de ferramentas, EPIs e formação"
      ]
    },
    {
      title: "Clientes",
      color: "bg-matershop-success",
      textColor: "text-green-100",
      icon: <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-green-200" />,
      benefits: [
        "Catálogo multiloja com entrega rápida",
        "Cashback em pontos a cada compra",
        "Programa de garantias: troque sem burocracia"
      ]
    },
    {
      title: "Lojistas",
      color: "bg-matershop-warning",
      textColor: "text-orange-100",
      icon: <Store className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200" />,
      benefits: [
        "Vitrine nacional sem custo fixo – pague só comissão",
        "Dashboard de vendas & estoque em tempo real",
        "Fidelização white-label: gere campanhas com pontos"
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {pillars.map((pillar, index) => (
            <Card key={index} className={`${pillar.color} border-0 overflow-hidden hover:scale-105 transition-transform duration-300`}>
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center mb-4 sm:mb-6">
                  {pillar.icon}
                  <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ml-3 sm:ml-4 ${pillar.textColor}`}>
                    {pillar.title}
                  </h3>
                </div>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {pillar.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className={`${pillar.textColor} flex items-start`}>
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                      <span className="text-xs sm:text-sm md:text-base leading-relaxed">{benefit}</span>
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
