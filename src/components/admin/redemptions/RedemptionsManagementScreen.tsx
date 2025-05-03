
import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Package } from 'lucide-react';
import { 
  fetchRedemptions, 
  approveRedemption, 
  rejectRedemption, 
  markRedemptionAsDelivered, 
  getRedemptionStatusBadgeColor,
  AdminRedemption
} from '@/services/adminRedemptionsService';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const RedemptionsManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    loadRedemptions();
  }, [isAdmin, isAdminLoading]);
  
  const loadRedemptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const redemptionsData = await fetchRedemptions();
      setRedemptions(redemptionsData);
    } catch (err) {
      setError('Failed to load redemptions. Please try again.');
      toast.error('Erro ao carregar resgates');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter redemptions based on search and filters
  const filteredRedemptions = redemptions.filter(redemption => {
    const matchesSearch = 
      !searchTerm || 
      redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redemption.item.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleApproveRedemption = async (redemptionId: string) => {
    try {
      await approveRedemption(redemptionId);
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'aprovado' } : redemption
        )
      );
      toast.success('Resgate aprovado com sucesso');
    } catch (err) {
      toast.error('Erro ao aprovar resgate');
    }
  };
  
  const handleRejectRedemption = async (redemptionId: string) => {
    try {
      await rejectRedemption(redemptionId);
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'recusado' } : redemption
        )
      );
      toast.success('Resgate recusado');
    } catch (err) {
      toast.error('Erro ao recusar resgate');
    }
  };
  
  const handleMarkAsDelivered = async (redemptionId: string) => {
    try {
      await markRedemptionAsDelivered(redemptionId);
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'entregue' } : redemption
        )
      );
      toast.success('Resgate marcado como entregue');
    } catch (err) {
      toast.error('Erro ao marcar resgate como entregue');
    }
  };
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Resgates">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Resgates">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este módulo."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout currentSection="Resgates">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Resgates</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os resgates realizados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar resgates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pendente')}
                size="sm"
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'aprovado' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('aprovado')}
                size="sm"
              >
                Aprovados
              </Button>
              <Button
                variant={statusFilter === 'entregue' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('entregue')}
                size="sm"
              >
                Entregues
              </Button>
              <Button
                variant={statusFilter === 'recusado' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('recusado')}
                size="sm"
              >
                Recusados
              </Button>
            </div>
          </div>
          
          {/* Redemptions Table */}
          {isLoading ? (
            <LoadingState text="Carregando resgates..." />
          ) : error ? (
            <ErrorState title="Erro" message={error} onRetry={loadRedemptions} />
          ) : filteredRedemptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhum resgate encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRedemptions.map(redemption => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-medium">{redemption.cliente_nome}</TableCell>
                      <TableCell>
                        {redemption.imagem_url && (
                          <img
                            src={redemption.imagem_url}
                            alt={redemption.item}
                            className="w-8 h-8 rounded-md inline mr-2 object-cover"
                          />
                        )}
                        {redemption.item}
                      </TableCell>
                      <TableCell>{redemption.pontos} pts</TableCell>
                      <TableCell>
                        <Badge className={getRedemptionStatusBadgeColor(redemption.status)}>
                          {redemption.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(redemption.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {redemption.status === 'pendente' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApproveRedemption(redemption.id)}>
                                <Check className="h-4 w-4 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectRedemption(redemption.id)}>
                                <X className="h-4 w-4 mr-1" /> Recusar
                              </Button>
                            </>
                          )}
                          {redemption.status === 'aprovado' && (
                            <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleMarkAsDelivered(redemption.id)}>
                              <Package className="h-4 w-4 mr-1" /> Marcar Entregue
                            </Button>
                          )}
                        </div>
                      </TableCell>
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

export default RedemptionsManagementScreen;
