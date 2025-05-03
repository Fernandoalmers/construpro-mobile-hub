
import React, { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import UserFilters from './UserFilters';
import UserTable from './UserTable';
import { 
  fetchUsers, 
  approveUser, 
  rejectUser,
  blockUser,
  unblockUser,
  deleteUser,
  makeAdmin,
  removeAdmin,
  getRoleBadgeColor, 
  getStatusBadgeColor 
} from '@/services/adminUsersService';
import { UserData } from '@/types/admin';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const UserManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
    
    loadUsers();
  }, [isAdmin, isAdminLoading]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await fetchUsers();
      setUsers(userData);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search and filters
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
    try {
      await approveUser(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
      toast.success('Usuário aprovado com sucesso');
    } catch (err) {
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await rejectUser(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'recusado' } : user
        )
      );
      toast.success('Usuário recusado');
    } catch (err) {
      toast.error('Erro ao recusar usuário');
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await blockUser(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'bloqueado' } : user
        )
      );
      toast.success('Usuário bloqueado com sucesso');
    } catch (err) {
      toast.error('Erro ao bloquear usuário');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUser(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
      toast.success('Usuário desbloqueado com sucesso');
    } catch (err) {
      toast.error('Erro ao desbloquear usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userId)
      );
      toast.success('Usuário excluído com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await makeAdmin(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: true } : user
        )
      );
      toast.success('Usuário promovido a administrador');
    } catch (err) {
      toast.error('Erro ao promover usuário a administrador');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeAdmin(userId);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: false } : user
        )
      );
      toast.success('Privilégios de administrador removidos');
    } catch (err) {
      toast.error('Erro ao remover privilégios de administrador');
    }
  };

  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Usuários">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Usuários">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este módulo."
          onRetry={() => window.location.href = '/profile'}
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
          <UserFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          
          <UserTable 
            filteredUsers={filteredUsers}
            isLoading={isLoading}
            handleApproveUser={handleApproveUser}
            handleRejectUser={handleRejectUser}
            handleBlockUser={handleBlockUser}
            handleUnblockUser={handleUnblockUser}
            handleDeleteUser={handleDeleteUser}
            handleMakeAdmin={handleMakeAdmin}
            handleRemoveAdmin={handleRemoveAdmin}
            getRoleBadgeColor={getRoleBadgeColor}
            getStatusBadgeColor={getStatusBadgeColor}
          />
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
