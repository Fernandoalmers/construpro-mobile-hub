
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { AdminStats } from '@/types/admin';

interface PendingItemsSectionProps {
  stats: AdminStats;
}

const PendingItemsSection: React.FC<PendingItemsSectionProps> = ({ stats }) => {
  return (
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
          <p className="text-2xl font-bold">{stats.users.pending}</p>
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
          <p className="text-2xl font-bold">{stats.products.pending}</p>
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
          <p className="text-2xl font-bold">{stats.redemptions.pending}</p>
          <p className="text-sm text-gray-500">Aguardando processamento</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingItemsSection;
