
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Store, Users, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from './useDashboardData';

const DashboardStats = () => {
  const navigate = useNavigate();
  const { totalProducts, totalStores, totalUsers, totalCategories, loading } = useDashboardData();
  
  const statItems = [
    {
      title: 'Total de Produtos',
      value: loading ? '...' : totalProducts.toString(),
      icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
      action: () => navigate('/admin/products')
    },
    {
      title: 'Total de Lojas',
      value: loading ? '...' : totalStores.toString(),
      icon: <Store className="w-8 h-8 text-green-500" />,
      action: () => navigate('/admin/stores')
    },
    {
      title: 'Total de Usuários',
      value: loading ? '...' : totalUsers.toString(),
      icon: <Users className="w-8 h-8 text-purple-500" />,
      action: () => navigate('/admin/users')
    },
    {
      title: 'Categorias',
      value: loading ? '...' : totalCategories.toString(),
      icon: <Tag className="w-8 h-8 text-amber-500" />,
      action: () => navigate('/admin/categories')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card 
          key={index} 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={item.action}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{item.value}</span>
              {item.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
