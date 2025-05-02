
import React from 'react';
import { 
  Table, TableBody, TableHead, 
  TableHeader, TableRow, TableCell 
} from '@/components/ui/table';
import UserTableRow from './UserTableRow';
import { UserData } from '@/types/admin';

interface UserTableProps {
  filteredUsers: UserData[];
  isLoading: boolean;
  handleApproveUser: (userId: string) => Promise<void>;
  handleRejectUser: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const UserTable: React.FC<UserTableProps> = ({
  filteredUsers,
  isLoading,
  handleApproveUser,
  handleRejectUser,
  handleDeleteUser,
  getRoleBadgeColor,
  getStatusBadgeColor
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
        <p className="mt-2 text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pontos</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => (
              <UserTableRow 
                key={user.id}
                user={user}
                handleApproveUser={handleApproveUser}
                handleRejectUser={handleRejectUser}
                handleDeleteUser={handleDeleteUser}
                getRoleBadgeColor={getRoleBadgeColor}
                getStatusBadgeColor={getStatusBadgeColor}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
