
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingCart, Store } from 'lucide-react';

const BenefitsPillars: React.FC = () => {
  const pillars = [
    {
      title: "Profissionais",
      color: "bg-blue-600",
      textColor: "text-blue-100",
      icon: <Users className="w-8 h-8 text-blue-200" />,
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
      icon: <ShoppingCart className="w-8 h-8 text-green-200" />,
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
      icon: <Store className="w-8 h-8 text-orange-200" />,
      benefits: [
        "Vitrine nacional sem custo fixo – pague só comissão",
        "Dashboard de vendas & estoque em tempo real",
        "Fidelização white-label: gere campanhas com pontos"
      ]
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Para cada tipo de usuário
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A Matershop oferece soluções específicas para profissionais, clientes e lojistas
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <Card key={index} className={`${pillar.color} border-0 overflow-hidden hover:scale-105 transition-transform duration-300`}>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  {pillar.icon}
                  <h3 className={`text-2xl font-bold ml-4 ${pillar.textColor}`}>
                    {pillar.title}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {pillar.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className={`${pillar.textColor} flex items-start`}>
                      <span className="w-2 h-2 rounded-full bg-white mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm leading-relaxed">{benefit}</span>
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
