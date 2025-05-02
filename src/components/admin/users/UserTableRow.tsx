
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Check, X, Edit, Trash2 } from 'lucide-react';
import { UserData } from '@/types/admin';

interface UserTableRowProps {
  user: UserData;
  handleApproveUser: (userId: string) => Promise<void>;
  handleRejectUser: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  handleApproveUser,
  handleRejectUser,
  handleDeleteUser,
  getRoleBadgeColor,
  getStatusBadgeColor
}) => {
  return (
    <TableRow key={user.id}>
      <TableCell>
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.nome} 
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={16} />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">
        <div>
          {user.nome}
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>{user.cpf || '-'}</TableCell>
      <TableCell>
        <Badge className={getRoleBadgeColor(user.papel || 'consumidor')}>
          {user.papel === 'profissional' ? 'Profissional' : 
           user.papel === 'lojista' ? 'Lojista' : 'Consumidor'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getStatusBadgeColor(user.status || 'ativo')}>
          {user.status === 'ativo' ? 'Ativo' : 
           user.status === 'pendente' ? 'Pendente' : 
           user.status === 'recusado' ? 'Recusado' : 'Desconhecido'}
        </Badge>
      </TableCell>
      <TableCell>{user.saldoPontos}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleApproveUser(user.id)}
          >
            <Check size={16} className="text-green-600" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleRejectUser(user.id)}
          >
            <X size={16} className="text-red-600" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
          >
            <Edit size={16} className="text-blue-600" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDeleteUser(user.id)}
          >
            <Trash2 size={16} className="text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
