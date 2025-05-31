
import React from 'react';
import UserTableRow from './UserTableRow';
import { Skeleton } from '@/components/ui/skeleton';
import { UserData } from '@/types/admin';

export interface UserTableProps {
  filteredUsers: UserData[];
  isLoading: boolean;
  handleApproveUser: (userId: string) => Promise<void>;
  handleRejectUser: (userId: string) => Promise<void>;
  handleBlockUser: (userId: string) => Promise<void>;
  handleUnblockUser: (userId: string) => Promise<void>;
  handleMakeAdmin: (userId: string) => Promise<void>;
  handleRemoveAdmin: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const UserTable: React.FC<UserTableProps> = ({
  filteredUsers,
  isLoading,
  handleApproveUser,
  handleRejectUser,
  handleBlockUser,
  handleUnblockUser,
  handleMakeAdmin,
  handleRemoveAdmin,
  handleDeleteUser,
  getRoleBadgeColor,
  getStatusBadgeColor
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-4 max-h-[600px] overflow-y-auto">
      <table className="w-full text-sm text-left text-gray-900">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
          <tr>
            <th className="px-4 py-3">Usuário</th>
            <th className="px-4 py-3">CPF</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Papel</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Indicado por</th>
            <th className="px-4 py-3">Especialidade</th>
            <th className="px-4 py-3 text-right">Pontos</th>
            <th className="px-4 py-3 text-right">Total Compras</th>
            <th className="px-4 py-3">Data Cadastro</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <UserTableRow 
                key={user.id}
                user={user}
                handleApproveUser={handleApproveUser}
                handleRejectUser={handleRejectUser}
                handleBlockUser={handleBlockUser}
                handleUnblockUser={handleUnblockUser}
                handleMakeAdmin={handleMakeAdmin}
                handleRemoveAdmin={handleRemoveAdmin}
                handleDeleteUser={handleDeleteUser}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusBadgeColor={getStatusBadgeColor}
              />
            ))
          ) : (
            <tr>
              <td colSpan={12} className="text-center py-4">
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
