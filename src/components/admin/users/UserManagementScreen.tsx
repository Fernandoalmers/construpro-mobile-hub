
import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, Check, X, Edit, Trash2, 
  ShieldCheck, ShieldX, User, RefreshCw 
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
  fetchUsers, approveUser, rejectUser, 
  blockUser, unblockUser, deleteUser,
  makeAdmin, removeAdmin,
  getRoleBadgeColor, getStatusBadgeColor 
} from '@/services/adminUsersService';
import { UserData } from '@/types/admin';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UserManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
    
    loadUsers();
  }, [isAdmin, isAdminLoading]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários. Tente novamente.');
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários com base na busca e filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      !searchTerm || 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf?.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.papel === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleApproveUser = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await approveUser(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await rejectUser(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'recusado' } : user
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await blockUser(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'bloqueado' } : user
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await unblockUser(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (isProcessing) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      setIsProcessing(true);
      await deleteUser(userId);
      
      // Atualizar estado local
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userId)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await makeAdmin(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: true } : user
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await removeAdmin(userId);
      
      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: false } : user
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

  // Se ainda está verificando se é admin
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Usuários">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // Se não for admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Usuários">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // Se houver erro ao carregar os usuários
  if (error) {
    return (
      <AdminLayout currentSection="Usuários">
        <ErrorState 
          title="Erro ao carregar usuários" 
          message={error}
          onRetry={loadUsers}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="Usuários">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CPF"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="lojista">Lojistas</SelectItem>
                  <SelectItem value="vendedor">Vendedores</SelectItem>
                  <SelectItem value="profissional">Profissionais</SelectItem>
                  <SelectItem value="consumidor">Consumidores</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="bloqueado">Bloqueados</SelectItem>
                  <SelectItem value="recusado">Recusados</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingState text="Carregando usuários..." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nome / Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.nome || 'Sem nome'}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.papel)}>
                            {user.papel || 'consumidor'}
                            {user.is_admin && ' (Admin)'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(user.status)}>
                            {user.status || 'ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.saldo_pontos || 0} pts</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
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
                                {user.status === 'pendente' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                      <Check size={16} className="mr-2 text-green-600" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRejectUser(user.id)}>
                                      <X size={16} className="mr-2 text-red-600" />
                                      Recusar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {user.status === 'ativo' ? (
                                  <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                                    <ShieldX size={16} className="mr-2 text-red-600" />
                                    Bloquear
                                  </DropdownMenuItem>
                                ) : user.status === 'bloqueado' && (
                                  <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                                    <ShieldCheck size={16} className="mr-2 text-green-600" />
                                    Desbloquear
                                  </DropdownMenuItem>
                                )}
                                
                                {user.is_admin ? (
                                  <DropdownMenuItem onClick={() => handleRemoveAdmin(user.id)}>
                                    <ShieldX size={16} className="mr-2 text-orange-600" />
                                    Remover Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                                    <ShieldCheck size={16} className="mr-2 text-blue-600" />
                                    Tornar Admin
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem onClick={() => window.location.href = `/admin/user-edit/${user.id}`}>
                                  <Edit size={16} className="mr-2 text-blue-600" />
                                  Editar
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
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
            Exibindo {filteredUsers.length} de {users.length} usuários
          </p>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default UserManagementScreen;
