
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Users, Check, Store } from 'lucide-react';

const DynamicHighlights: React.FC = () => {
  const highlights = [
    {
      title: "Ofertas Relâmpago",
      description: "Até 40% off todo dia",
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "App Mobile",
      description: "Gerencie pedidos onde estiver",
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Pagamento Seguro",
      description: "Pague na entrega",
      icon: <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Integração Loja-Física",
      description: "Compre na loja física e ganhe pontos instantâneos",
      icon: <Store className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Vantagens Exclusivas
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Benefícios que fazem a diferença no seu dia a dia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {highlights.map((highlight, index) => (
            <Card key={index} className={`border-2 ${highlight.borderColor} ${highlight.bgColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-2`}>
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                    {highlight.icon}
                  </div>
                </div>
                
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {highlight.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
