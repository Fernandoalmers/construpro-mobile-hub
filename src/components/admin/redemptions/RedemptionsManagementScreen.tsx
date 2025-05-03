
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';

const RedemptionsManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Função memoizada para carregar resgates
  const loadRedemptions = useCallback(async (forceRefresh = false) => {
    if (!isAdmin) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const redemptionsData = await fetchRedemptions(forceRefresh);
      setRedemptions(redemptionsData);
    } catch (err) {
      setError('Falha ao carregar resgates. Por favor, tente novamente.');
      toast.error('Erro ao carregar resgates');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Espera pela verificação de status de admin
    }
    
    if (!isAdmin) {
      setError('Não autorizado: Acesso de administrador necessário');
      setIsLoading(false);
      return;
    }
    
    loadRedemptions();
    // Dependências controladas: só executa quando isAdmin ou isAdminLoading mudam
  }, [isAdmin, isAdminLoading, loadRedemptions]);
  
  // Filtrar resgates baseado na busca e filtros (memoizado para evitar recálculos)
  const filteredRedemptions = useMemo(() => {
    return redemptions.filter(redemption => {
      const matchesSearch = 
        !searchTerm || 
        redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        redemption.item.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [redemptions, searchTerm, statusFilter]);
  
  const handleApproveRedemption = async (redemptionId: string) => {
    if (isProcessing) return; // Evita múltiplas ações simultâneas
    
    try {
      setIsProcessing(true);
      const success = await approveRedemption(redemptionId);
      
      if (success) {
        // Atualiza o estado localmente para evitar recarga
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'aprovado' } : redemption
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRejectRedemption = async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await rejectRedemption(redemptionId);
      
      if (success) {
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'recusado' } : redemption
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMarkAsDelivered = async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await markRedemptionAsDelivered(redemptionId);
      
      if (success) {
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'entregue' } : redemption
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Componente de skeleton para carregamento
  const TableSkeleton = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-32" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  // Se status de admin ainda está carregando
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Resgates">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Resgates</CardTitle>
            <CardDescription>Verificando permissões...</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState text="Verificando permissões de administrador..." />
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }
  
  // Se usuário não é admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Resgates">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissões para acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorState 
              title="Acesso Negado" 
              message="Você não tem permissões de administrador para acessar este módulo."
              onRetry={() => window.location.href = '/profile'}
            />
          </CardContent>
        </Card>
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
          {/* Busca e filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar resgates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
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
          
          {/* Tabela de Resgates */}
          {isLoading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState title="Erro" message={error} onRetry={() => loadRedemptions(true)} />
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
                            loading="lazy" // Lazy loading para imagens
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
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600"
                                onClick={() => handleApproveRedemption(redemption.id)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4 mr-1" /> Aprovar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600"
                                onClick={() => handleRejectRedemption(redemption.id)}
                                disabled={isProcessing}
                              >
                                <X className="h-4 w-4 mr-1" /> Recusar
                              </Button>
                            </>
                          )}
                          {redemption.status === 'aprovado' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600"
                              onClick={() => handleMarkAsDelivered(redemption.id)}
                              disabled={isProcessing}
                            >
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
