
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Store, Users, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardStats = () => {
  const navigate = useNavigate();
  
  // For simplicity, we'll use placeholders for stats
  // In a full implementation, these would come from API calls
  const [stats] = useState({
    productsCount: '---',
    storesCount: '---',
    usersCount: '---',
    categoriesCount: '---'
  });

  const statItems = [
    {
      title: 'Total de Produtos',
      value: stats.productsCount,
      icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
      action: () => navigate('/admin/products')
    },
    {
      title: 'Total de Lojas',
      value: stats.storesCount,
      icon: <Store className="w-8 h-8 text-green-500" />,
      action: () => navigate('/admin/stores')
    },
    {
      title: 'Total de Usuários',
      value: stats.usersCount,
      icon: <Users className="w-8 h-8 text-purple-500" />,
      action: () => navigate('/admin/users')
    },
    {
      title: 'Categorias',
      value: stats.categoriesCount,
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
