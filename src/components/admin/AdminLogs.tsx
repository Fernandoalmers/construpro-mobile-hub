
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { 
  Table, TableBody, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Filter, Clock } from 'lucide-react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AdminLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_id: string;
  admin_name?: string;
  created_at: string;
  details?: any;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, fetch from Supabase
        const { data, error } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // For demo purposes, we'll create some fake logs if none exist
        if (!data || data.length === 0) {
          // Generate demo logs
          const demoLogs: AdminLog[] = [
            {
              id: '1',
              action: 'approve',
              entity_type: 'product',
              entity_id: '1',
              admin_id: '1',
              admin_name: 'Admin User',
              created_at: new Date().toISOString(),
              details: { product_name: 'Furadeira de Impacto 750W' }
            },
            {
              id: '2',
              action: 'reject',
              entity_type: 'user',
              entity_id: '3',
              admin_id: '1',
              admin_name: 'Admin User',
              created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              details: { user_name: 'Carlos Pereira' }
            },
            {
              id: '3',
              action: 'update',
              entity_type: 'reward',
              entity_id: '2',
              admin_id: '1',
              admin_name: 'Admin User',
              created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              details: { reward_name: 'Vale-compra R$100' }
            }
          ];
          setLogs(demoLogs);
        } else {
          // Use real data
          setLogs(data);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Erro ao carregar logs administrativos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  // Extract unique entity types and actions for filters
  const entityTypes = Array.from(new Set(logs.map(log => log.entity_type)));
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      !searchTerm || 
      log.entity_id.includes(searchTerm) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'approve': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-amber-100 text-amber-800';
      case 'create': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch(action) {
      case 'approve': return 'Aprovação';
      case 'reject': return 'Rejeição';
      case 'update': return 'Atualização';
      case 'delete': return 'Exclusão';
      case 'create': return 'Criação';
      default: return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch(entity) {
      case 'product': return 'Produto';
      case 'user': return 'Usuário';
      case 'store': return 'Loja';
      case 'reward': return 'Recompensa';
      case 'redemption': return 'Resgate';
      case 'order': return 'Pedido';
      default: return entity;
    }
  };

  return (
    <AdminLayout currentSection="Logs">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="space-y-1.5">
            <CardTitle>Logs administrativos</CardTitle>
            <CardDescription>
              Registro das ações administrativas realizadas na plataforma
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, usuário ou detalhes"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>{getEntityLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{getActionLabel(action)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
              <p className="mt-2 text-gray-500">Carregando logs...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>{log.admin_name || log.admin_id}</TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getEntityLabel(log.entity_type)}</TableCell>
                        <TableCell>{log.entity_id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.details ? (
                            <span title={JSON.stringify(log.details)}>
                              {log.details.product_name || 
                               log.details.user_name || 
                               log.details.reward_name || 
                               JSON.stringify(log.details).substring(0, 30) + '...'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Exibindo {filteredLogs.length} de {logs.length} logs
          </p>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default AdminLogs;
