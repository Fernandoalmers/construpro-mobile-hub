
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ShoppingBag, Store, Gift, AlertCircle } from 'lucide-react';
import { AdminStats } from '@/types/admin';

interface DashboardStatsProps {
  stats: AdminStats;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">Usuários</CardTitle>
            <div className="p-2 rounded-full bg-blue-50">
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
          <CardDescription>Total de usuários registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.users.total}</p>
          {stats.users.pending > 0 && (
            <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {stats.users.pending} usuário{stats.users.pending !== 1 ? 's' : ''} pendente{stats.users.pending !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">Produtos</CardTitle>
            <div className="p-2 rounded-full bg-emerald-50">
              <ShoppingBag className="text-emerald-500" size={24} />
            </div>
          </div>
          <CardDescription>Produtos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.products.total}</p>
          {stats.products.pending > 0 && (
            <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {stats.products.pending} produto{stats.products.pending !== 1 ? 's' : ''} pendente{stats.products.pending !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">Lojas</CardTitle>
            <div className="p-2 rounded-full bg-purple-50">
              <Store className="text-purple-500" size={24} />
            </div>
          </div>
          <CardDescription>Lojas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.stores.total}</p>
          {stats.stores.pending > 0 && (
            <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {stats.stores.pending} loja{stats.stores.pending !== 1 ? 's' : ''} pendente{stats.stores.pending !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">Resgates</CardTitle>
            <div className="p-2 rounded-full bg-amber-50">
              <Gift className="text-amber-500" size={24} />
            </div>
          </div>
          <CardDescription>Resgates realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.redemptions.total}</p>
          {stats.redemptions.pending > 0 && (
            <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {stats.redemptions.pending} resgate{stats.redemptions.pending !== 1 ? 's' : ''} pendente{stats.redemptions.pending !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
