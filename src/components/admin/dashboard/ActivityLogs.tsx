import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useDashboardData } from './useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  details?: any;
  admin_name?: string;
}

const ActivityLogs: React.FC = () => {
  const { recentActivity, activitiesLoading } = useDashboardData();
  
  // Format the date display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If today
      if (date.toDateString() === now.toDateString()) {
        return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
      }
      
      // If yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
      }
      
      // Otherwise
      return format(date, 'dd/MM, HH:mm', { locale: ptBR });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'Data desconhecida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Atividades Recentes</CardTitle>
          <Clock size={20} />
        </div>
        <CardDescription>Últimas ações realizadas no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {activitiesLoading ? (
          <div className="py-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Não há atividades recentes para exibir
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity: ActivityLog) => (
              <div key={activity.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">
                    {activity.admin_name}: {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.entity}</p>
                </div>
                <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
