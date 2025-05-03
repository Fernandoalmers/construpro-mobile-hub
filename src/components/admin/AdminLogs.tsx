
import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ClipboardList } from 'lucide-react';
import { fetchAdminLogs } from '@/services/adminService';
import { AdminLog } from '@/types/admin';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const AdminLogs: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    loadLogs();
  }, [isAdmin, isAdminLoading]);
  
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const logsData = await fetchAdminLogs(100); // Get up to 100 logs
      setLogs(logsData);
    } catch (err) {
      setError('Failed to load admin logs. Please try again.');
      toast.error('Erro ao carregar logs administrativos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract unique action types from logs
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));
  
  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });
  
  // Format log details
  const formatDetails = (details: any) => {
    if (!details) return 'Sem detalhes';
    
    try {
      if (typeof details === 'string') {
        return details;
      }
      return JSON.stringify(details, null, 2);
    } catch (err) {
      return 'Erro ao formatar detalhes';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };
  
  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    } else if (action.includes('approve')) {
      return 'bg-purple-100 text-purple-800';
    } else if (action.includes('reject')) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Logs">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Logs">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este módulo."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout currentSection="Logs">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Administração</CardTitle>
          <CardDescription>
            Registro de todas as ações realizadas por administradores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={actionFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setActionFilter('all')}
                size="sm"
              >
                Todas Ações
              </Button>
              {actionTypes.map(actionType => (
                <Button
                  key={actionType}
                  variant={actionFilter === actionType ? 'default' : 'outline'}
                  onClick={() => setActionFilter(actionType)}
                  size="sm"
                >
                  {actionType}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Logs Table */}
          {isLoading ? (
            <LoadingState text="Carregando logs..." />
          ) : error ? (
            <ErrorState title="Erro" message={error} onRetry={loadLogs} />
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum log administrativo encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin_name || log.admin_id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entity_id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {formatDetails(log.details)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLogs;
