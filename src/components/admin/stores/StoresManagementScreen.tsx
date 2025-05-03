
import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, Check, X, Edit, Trash2, 
  Store, Search, RefreshCw, ShoppingBag 
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
  AdminStore, fetchAdminStores, approveStore, 
  rejectStore, deleteStore, getStoreBadgeColor 
} from '@/services/adminStoresService';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StoresManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [stores, setStores] = useState<AdminStore[]>([]);
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
    
    loadStores();
  }, [isAdmin, isAdminLoading]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storesData = await fetchAdminStores();
      setStores(storesData);
    } catch (error) {
      console.error('Error loading stores:', error);
      setError('Erro ao carregar lojas. Tente novamente.');
      toast.error('Erro ao carregar lojas');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar lojas com base na busca e filtros
  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      !searchTerm || 
      store.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApproveStore = async (storeId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await approveStore(storeId);
      
      // Atualizar estado local
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === storeId ? { ...store, status: 'ativa' } : store
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectStore = async (storeId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await rejectStore(storeId);
      
      // Atualizar estado local
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === storeId ? { ...store, status: 'recusada' } : store
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (isProcessing) return;
    
    if (!window.confirm('Tem certeza que deseja excluir esta loja?')) {
      return;
    }
    
    try {
      setIsProcessing(true);
      await deleteStore(storeId);
      
      // Atualizar estado local
      setStores(prevStores => 
        prevStores.filter(store => store.id !== storeId)
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
      year: 'numeric'
    });
  };

  // Se ainda está verificando se é admin
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Lojas">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // Se não for admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Lojas">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // Se houver erro ao carregar as lojas
  if (error) {
    return (
      <AdminLayout currentSection="Lojas">
        <ErrorState 
          title="Erro ao carregar lojas" 
          message={error}
          onRetry={loadStores}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="Lojas">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Lojas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as lojas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome da loja ou proprietário"
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
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="recusada">Recusadas</SelectItem>
                  <SelectItem value="inativa">Inativas</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={loadStores} disabled={isLoading}>
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingState text="Carregando lojas..." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Logo / Nome</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma loja encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {store.logo_url ? (
                              <img 
                                src={store.logo_url} 
                                alt={store.nome}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                <Store size={20} className="text-gray-400" />
                              </div>
                            )}
                            <span>{store.nome || 'Sem nome'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{store.proprietario_nome || 'Desconhecido'}</TableCell>
                        <TableCell>
                          <Badge className={getStoreBadgeColor(store.status)}>
                            {store.status || 'pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ShoppingBag size={16} className="text-gray-400" />
                            <span>{store.produtos_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(store.created_at)}</TableCell>
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
                                {store.status === 'pendente' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApproveStore(store.id)}>
                                      <Check size={16} className="mr-2 text-green-600" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRejectStore(store.id)}>
                                      <X size={16} className="mr-2 text-red-600" />
                                      Recusar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                <DropdownMenuItem onClick={() => window.location.href = `/admin/store-edit/${store.id}`}>
                                  <Edit size={16} className="mr-2 text-blue-600" />
                                  Editar
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => window.location.href = `/admin/store-products/${store.id}`}>
                                  <ShoppingBag size={16} className="mr-2 text-purple-600" />
                                  Ver Produtos
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteStore(store.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Excluir
                                </DropdownMenuItem>
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
            Exibindo {filteredStores.length} de {stores.length} lojas
          </p>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default StoresManagementScreen;
