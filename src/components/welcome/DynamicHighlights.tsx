
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Users, Check, Store } from 'lucide-react';

const DynamicHighlights: React.FC = () => {
  const highlights = [
    {
      title: "Ofertas Relâmpago",
      description: "Até 40% off todo dia",
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
    },
    {
      title: "App Mobile",
      description: "Gerencie pedidos onde estiver",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
    },
    {
      title: "Pagamento Seguro",
      description: "Pague na entrega",
      icon: <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
    },
    {
      title: "Integração Loja-Física",
      description: "Compre na loja física e ganhe pontos instantâneos",
      icon: <Store className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Vantagens Exclusivas
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Benefícios que fazem a diferença no seu dia a dia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {highlights.map((highlight, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {highlight.icon}
                  </div>
                </div>
                
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
                  {highlight.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-gray-600">
                  {highlight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamicHighlights;
