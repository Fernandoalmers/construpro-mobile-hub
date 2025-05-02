
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, Store, Gift, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStat {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStat[]>([
    {
      title: 'Usuários',
      value: '...',
      description: 'Total de usuários registrados',
      icon: <Users className="text-blue-500" size={24} />,
      color: 'bg-blue-50'
    },
    {
      title: 'Produtos',
      value: '...',
      description: 'Produtos cadastrados',
      icon: <ShoppingBag className="text-emerald-500" size={24} />,
      color: 'bg-emerald-50'
    },
    {
      title: 'Lojas',
      value: '...',
      description: 'Lojas ativas',
      icon: <Store className="text-purple-500" size={24} />,
      color: 'bg-purple-50'
    },
    {
      title: 'Resgates',
      value: '...',
      description: 'Resgates realizados',
      icon: <Gift className="text-amber-500" size={24} />,
      color: 'bg-amber-50'
    }
  ]);
  
  const [pendingItems, setPendingItems] = useState({
    users: 0,
    products: 0,
    redemptions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch number of users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // In a real app, fetch these from your database tables
        // For now we'll use demo data from the JSON files
        const lojas = (await import('../../data/lojas.json')).default;
        const produtos = (await import('../../data/produtos.json')).default;
        const resgates = (await import('../../data/resgates.json')).default;

        // Update stats with real data
        setStats(prev => [
          { ...prev[0], value: userCount || '0' },
          { ...prev[1], value: produtos.length },
          { ...prev[2], value: lojas.length },
          { ...prev[3], value: resgates.length },
        ]);

        // For pending items, in real app you would check status fields
        setPendingItems({
          users: 2, // Demo data
          products: 3, // Demo data
          redemptions: 5 // Demo data
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout currentSection="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Items Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Usuários Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{pendingItems.users}</p>
              <p className="text-sm text-gray-500">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Produtos Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{pendingItems.products}</p>
              <p className="text-sm text-gray-500">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Resgates Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{pendingItems.redemptions}</p>
              <p className="text-sm text-gray-500">Aguardando processamento</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Atividades Recentes</CardTitle>
              <Clock size={20} />
            </div>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Aprovação de produto</p>
                  <p className="text-sm text-gray-500">Furadeira de Impacto 750W</p>
                </div>
                <p className="text-sm text-gray-500">Hoje, 10:30</p>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Cadastro de recompensa</p>
                  <p className="text-sm text-gray-500">Vale-compra R$100</p>
                </div>
                <p className="text-sm text-gray-500">Hoje, 09:15</p>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Aprovação de loja</p>
                  <p className="text-sm text-gray-500">Casa do Construtor</p>
                </div>
                <p className="text-sm text-gray-500">Ontem, 14:20</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
