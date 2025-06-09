
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, TrendingUp, Target } from 'lucide-react';
import { LoyaltyStats } from '@/services/admin/loyaltyService';

interface LoyaltyStatsCardsProps {
  stats: LoyaltyStats;
  isLoading: boolean;
}

const LoyaltyStatsCards: React.FC<LoyaltyStatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.activeUsers} ativos`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pontos em Circulação',
      value: stats.totalPointsInCirculation.toLocaleString(),
      subtitle: `Média: ${stats.averagePointsPerUser} pts/usuário`,
      icon: Trophy,
      color: 'text-yellow-600'
    },
    {
      title: 'Maior Saldo Individual',
      value: stats.topUserPoints.toLocaleString(),
      subtitle: 'Pontos',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Total de Transações',
      value: stats.totalTransactions.toLocaleString(),
      subtitle: `${stats.totalAdjustments} ajustes`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statsCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoyaltyStatsCards;
