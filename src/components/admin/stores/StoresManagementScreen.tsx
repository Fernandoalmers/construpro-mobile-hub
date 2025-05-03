
import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { AdminStore, fetchAdminStores, approveStore, rejectStore, deleteStore, getStoreBadgeColor, subscribeToAdminStoreUpdates } from '@/services/adminStoresService';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { RealtimeChannel } from '@supabase/supabase-js';

const StoresManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    loadStores();
    
    // Configurar realtime para lojas
    const channel = subscribeToAdminStoreUpdates((store, eventType) => {
      // Recarregar lojas quando houver mudanças
      loadStores();
      
      // Exibir notificações relevantes
      if (eventType === 'INSERT') {
        toast.info('Nova loja cadastrada - Aguardando aprovação', {
          description: store.nome
        });
      } else if (eventType === 'UPDATE') {
        toast.info('Loja atualizada', {
          description: store.nome
        });
      }
    });
    
    setRealtimeChannel(channel);
    
    // Limpar assinatura ao desmontar componente
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [isAdmin, isAdminLoading]);
  
  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const storesData = await fetchAdminStores();
      setStores(storesData);
    } catch (err) {
      setError('Failed to load stores. Please try again.');
      toast.error('Erro ao carregar lojas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter stores based on search and filters
  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      !searchTerm || 
      store.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Contagem de lojas pendentes para destaque na UI
  const pendingStoresCount = stores.filter(s => s.status === 'pendente').length;
  
  const handleApproveStore = async (storeId: string) => {
    try {
      await approveStore(storeId);
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === storeId ? { ...store, status: 'ativa' } : store
        )
      );
      toast.success('Loja aprovada com sucesso');
    } catch (err) {
      toast.error('Erro ao aprovar loja');
    }
  };
  
  const handleRejectStore = async (storeId: string) => {
    try {
      await rejectStore(storeId);
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === storeId ? { ...store, status: 'recusada' } : store
        )
      );
      toast.success('Loja recusada');
    } catch (err) {
      toast.error('Erro ao recusar loja');
    }
  };
  
  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta loja?')) {
      return;
    }
    
    try {
      await deleteStore(storeId);
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === storeId ? { ...store, status: 'excluida' } : store
        )
      );
      toast.success('Loja marcada como excluída');
    } catch (err) {
      toast.error('Erro ao excluir loja');
    }
  };
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Lojas">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Lojas">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este módulo."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout currentSection="Lojas">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciamento de Lojas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as lojas da plataforma
              </CardDescription>
            </div>
            {pendingStoresCount > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 px-3 py-1">
                {pendingStoresCount} loja{pendingStoresCount !== 1 ? 's' : ''} pendente{pendingStoresCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar lojas..."
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
                Todas
              </Button>
              <Button
                variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pendente')}
                size="sm"
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'ativa' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ativa')}
                size="sm"
              >
                Ativas
              </Button>
              <Button
                variant={statusFilter === 'recusada' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('recusada')}
                size="sm"
              >
                Recusadas
              </Button>
            </div>
          </div>
          
          {/* Stores Table */}
          {isLoading ? (
            <LoadingState text="Carregando lojas..." />
          ) : error ? (
            <ErrorState title="Erro" message={error} onRetry={loadStores} />
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhuma loja encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map(store => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">
                        {store.logo_url && (
                          <img
                            src={store.logo_url}
                            alt={store.nome}
                            className="w-8 h-8 rounded-full inline mr-2 object-cover"
                          />
                        )}
                        {store.nome}
                      </TableCell>
                      <TableCell>{store.proprietario_nome || 'Não informado'}</TableCell>
                      <TableCell>
                        <Badge className={getStoreBadgeColor(store.status)}>
                          {store.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{store.produtos_count}</TableCell>
                      <TableCell>{new Date(store.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {store.status === 'pendente' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApproveStore(store.id)}>
                                Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectStore(store.id)}>
                                Recusar
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDeleteStore(store.id)}>
                            Excluir
                          </Button>
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

export default StoresManagementScreen;
