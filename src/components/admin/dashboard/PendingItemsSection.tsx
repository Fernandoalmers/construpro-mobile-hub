
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Gift, AlertTriangle } from 'lucide-react';
import LoadingState from '@/components/common/LoadingState';

interface PendingItemsSectionProps {
  pendingProducts: number;
  pendingStores: number;
  pendingRedemptions: number;
  loading: boolean;
}

const PendingItemsSection: React.FC<PendingItemsSectionProps> = ({
  pendingProducts,
  pendingStores,
  pendingRedemptions,
  loading
}) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Itens Pendentes de Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center">
          <LoadingState text="Carregando..." />
        </CardContent>
      </Card>
    );
  }

  const pendingItems = [
    {
      title: 'Produtos Pendentes',
      count: pendingProducts,
      icon: <ShoppingBag className="w-6 h-6 text-amber-500" />,
      action: () => navigate('/admin/products?filter=pendente')
    },
    {
      title: 'Lojas Pendentes',
      count: pendingStores,
      icon: <Store className="w-6 h-6 text-blue-500" />,
      action: () => navigate('/admin/stores?filter=pendente')
    },
    {
      title: 'Resgates Pendentes',
      count: pendingRedemptions,
      icon: <Gift className="w-6 h-6 text-purple-500" />,
      action: () => navigate('/admin/redemptions?filter=pendente')
    },
  ];
  
  const hasPendingItems = pendingProducts > 0 || pendingStores > 0 || pendingRedemptions > 0;

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Itens Pendentes de Aprovação</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPendingItems ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingItems.map((item, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 flex flex-col items-center justify-between"
              >
                <div className="flex flex-col items-center">
                  {item.icon}
                  <h3 className="font-medium mt-2">{item.title}</h3>
                  <span className="text-2xl font-bold mt-1">{item.count}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={item.action}
                >
                  Visualizar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-gray-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Nenhum item pendente de aprovação!</span>
            </div>
            <p className="text-sm mt-2">Todos os itens foram processados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingItemsSection;
