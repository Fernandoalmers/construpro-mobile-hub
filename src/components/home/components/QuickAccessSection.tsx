
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Gift, HelpCircle, Ticket } from 'lucide-react';

const QuickAccessSection: React.FC = () => {
  const navigate = useNavigate();

  const quickAccessItems = [
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: 'Compras',
      subtitle: 'Ver pedidos',
      path: '/compras',
      color: 'bg-blue-500'
    },
    {
      icon: <Ticket className="h-6 w-6" />,
      title: 'Cupons',
      subtitle: 'Descontos exclusivos',
      path: '/meus-cupons',
      color: 'bg-orange-500'
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: 'Resgates',
      subtitle: 'Troque seus pontos',
      path: '/resgates',
      color: 'bg-green-500'
    },
    {
      icon: <HelpCircle className="h-6 w-6" />,
      title: 'Suporte',
      subtitle: 'Ajuda e contato',
      path: '/suporte',
      color: 'bg-purple-500'
    }
  ];

  const handleQuickAccess = (path: string) => {
    navigate(path);
  };

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Acesso Rápido</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickAccessItems.map((item, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleQuickAccess(item.path)}
          >
            <CardContent className="p-3 text-center">
              <div className={`${item.color} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-white`}>
                {item.icon}
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickAccessSection;
