
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

const PromotionsSection: React.FC = () => {
  const navigate = useNavigate();

  const promotionalOffers = [
    {
      title: "Ganhe 500 pontos",
      subtitle: "Em compras acima de R$ 200",
      validUntil: "31/12/2024",
      color: "bg-green-500"
    },
    {
      title: "Frete Grátis",
      subtitle: "Para pedidos acima de R$ 150",
      validUntil: "15/01/2025",
      color: "bg-blue-500"
    },
    {
      title: "Desconto 15%",
      subtitle: "Em ferramentas elétricas",
      validUntil: "28/12/2024",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Promoções</h3>
        <Button
          variant="outline"
          onClick={() => navigate('/marketplace')}
          size="sm"
          className="text-xs"
        >
          Ver Todas
        </Button>
      </div>
      
      <div className="space-y-2">
        {promotionalOffers.map((offer, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className={`${offer.color} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Gift className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">{offer.title}</h4>
                  <p className="text-xs text-gray-600">{offer.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">Válido até</p>
                  <p className="text-xs font-medium text-gray-700">{offer.validUntil}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromotionsSection;
