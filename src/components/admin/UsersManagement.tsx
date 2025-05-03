import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import UserFilters from './users/UserFilters';
import UserTable from './users/UserTable';
import { 
  fetchUsers, 
  approveUser, 
  rejectUser, 
  deleteUser,
  blockUser,
  unblockUser,
  makeAdmin,
  removeAdmin,
  getRoleBadgeColor, 
  getStatusBadgeColor 
} from '@/services/userManagementService';
import { UserData } from '@/types/admin';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const userData = await fetchUsers();
      setUsers(userData);
      setIsLoading(false);
    };

    loadUsers();
  }, []);

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
    const success = await approveUser(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
    }
  };

  const handleRejectUser = async (userId: string) => {
    const success = await rejectUser(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'recusado' } : user
        )
      );
    }
  };

  const handleBlockUser = async (userId: string) => {
    const success = await blockUser(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'bloqueado' } : user
        )
      );
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const success = await unblockUser(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    const success = await makeAdmin(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: true } : user
        )
      );
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    const success = await removeAdmin(userId);
    if (success) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: false } : user
        )
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userId)
      );
    }
  };

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

export default UsersManagement;
