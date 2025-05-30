
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  details: any;
  created_at: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading security events:', error);
        toast.error('Erro ao carregar eventos de segurança');
        return;
      }

      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Exception loading security events:', error);
      toast.error('Erro interno ao carregar eventos');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('violation') || eventType.includes('blocked')) {
      return 'bg-red-100 text-red-800';
    }
    if (eventType.includes('success') || eventType.includes('added')) {
      return 'bg-green-100 text-green-800';
    }
    if (eventType.includes('rate_limit') || eventType.includes('unauthorized')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('violation')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (eventType.includes('success')) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando eventos de segurança...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dashboard de Segurança
          </CardTitle>
          <CardDescription>
            Monitore eventos de segurança e atividades suspeitas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Eventos Recentes</h3>
            <Button onClick={loadSecurityEvents} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum evento de segurança registrado
              </p>
            ) : (
              securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getEventBadgeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Usuário: {event.user_id || 'Anônimo'}
                    </p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">
                          Ver detalhes
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
