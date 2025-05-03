
import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, Check, X, Search, RefreshCw, 
  User, Gift, Clock, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, 
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { 
  AdminRedemption, fetchAdminRedemptions, approveRedemption, 
  rejectRedemption, markRedemptionDelivered,
  getRedemptionStatusBadgeColor 
} from '@/services/adminRedemptionsService';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RedemptionsManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAdminLoading) {
      return; // Aguardar verificação de administrador
    }
    
    if (!isAdmin) {
      setError('Acesso não autorizado: Apenas administradores podem acessar esta página');
      setIsLoading(false);
      return;
    }
    
    loadRedemptions();
  }, [isAdmin, isAdminLoading]);

  const loadRedemptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const redemptionsData = await fetchAdminRedemptions();
      setRedemptions(redemptionsData);
    } catch (error) {
      console.error('Error loading redemptions:', error);
      setError('Erro ao carregar resgates. Tente novamente.');
      toast.error('Erro ao carregar resgates');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar resgates com base na busca e filtros
  const filteredRedemptions = redemptions.filter(redemption => {
    const matchesSearch = 
      !searchTerm || 
      redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redemption.item?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApproveRedemption = async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await approveRedemption(redemptionId);
      
      // Atualizar estado local
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'aprovado' } : redemption
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRedemption = async (redemptionId: string) => {
    if (isProcessing) return;
    
    if (!window.confirm('Tem certeza que deseja recusar este resgate? Os pontos serão devolvidos ao cliente.')) {
      return;
    }
    
    try {
      setIsProcessing(true);
      await rejectRedemption(redemptionId);
      
      // Atualizar estado local
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'recusado' } : redemption
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkDelivered = async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await markRedemptionDelivered(redemptionId);
      
      // Atualizar estado local
      setRedemptions(prevRedemptions =>
        prevRedemptions.map(redemption =>
          redemption.id === redemptionId ? { ...redemption, status: 'entregue' } : redemption
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString('pt-BR');
  };

  // Se ainda está verificando se é admin
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Resgates">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // Se não for admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Resgates">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // Se houver erro ao carregar os resgates
  if (error) {
    return (
      <AdminLayout currentSection="Resgates">
        <ErrorState 
          title="Erro ao carregar resgates" 
          message={error}
          onRetry={loadRedemptions}
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
            Visualize e gerencie todos os resgates da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente ou item"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                  <SelectItem value="recusado">Recusados</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={loadRedemptions} disabled={isLoading}>
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingState text="Carregando resgates..." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Item</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRedemptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum resgate encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRedemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {redemption.imagem_url ? (
                              <img 
                                src={redemption.imagem_url} 
                                alt={redemption.item}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                <Gift size={20} className="text-gray-400" />
                              </div>
                            )}
                            <span>{redemption.item}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User size={16} className="text-gray-400" />
                            <span>{redemption.cliente_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatPoints(redemption.pontos)} pts</TableCell>
                        <TableCell>
                          <Badge className={getRedemptionStatusBadgeColor(redemption.status)}>
                            {redemption.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-gray-400" />
                            <span>{formatDate(redemption.data)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                {redemption.status === 'pendente' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApproveRedemption(redemption.id)}>
                                      <Check size={16} className="mr-2 text-green-600" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRejectRedemption(redemption.id)}>
                                      <X size={16} className="mr-2 text-red-600" />
                                      Recusar e Devolver Pontos
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {redemption.status === 'aprovado' && (
                                  <DropdownMenuItem onClick={() => handleMarkDelivered(redemption.id)}>
                                    <CheckCircle2 size={16} className="mr-2 text-blue-600" />
                                    Marcar como Entregue
                                  </DropdownMenuItem>
                                )}
                                
                                {redemption.codigo && (
                                  <DropdownMenuItem>
                                    <AlertTriangle size={16} className="mr-2 text-amber-600" />
                                    Código: {redemption.codigo}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            Exibindo {filteredRedemptions.length} de {redemptions.length} resgates
          </p>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default RedemptionsManagementScreen;
