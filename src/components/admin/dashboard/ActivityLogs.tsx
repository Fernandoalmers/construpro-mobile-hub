import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  details?: string;
}

interface ActivityLogsProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ activities, isLoading }) => {
  // Format the date display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today
    if (date.toDateString() === now.toDateString()) {
      return `Hoje, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // If yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Otherwise
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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
        {isLoading ? (
          <div className="py-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Não há atividades recentes para exibir
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">{activity.action}</p>
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
