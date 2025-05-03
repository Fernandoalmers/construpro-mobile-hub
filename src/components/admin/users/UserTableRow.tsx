
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Trash2, UserX, UserCheck, Shield, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserData } from '@/types/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface UserTableRowProps {
  user: UserData;
  handleApproveUser: (userId: string) => Promise<void>;
  handleRejectUser: (userId: string) => Promise<void>;
  handleBlockUser: (userId: string) => Promise<void>;
  handleUnblockUser: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleMakeAdmin: (userId: string) => Promise<void>;
  handleRemoveAdmin: (userId: string) => Promise<void>;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({ 
  user, 
  handleApproveUser,
  handleRejectUser,
  handleBlockUser,
  handleUnblockUser,
  handleDeleteUser,
  handleMakeAdmin,
  handleRemoveAdmin,
  getRoleBadgeColor,
  getStatusBadgeColor
}) => {
  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">
        {user.nome || 'Sem nome'}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline" className={getRoleBadgeColor(user.papel || 'consumidor')}>
          {user.papel || user.tipo_perfil || 'consumidor'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getStatusBadgeColor(user.status || 'ativo')}>
          {user.status || 'ativo'}
        </Badge>
      </TableCell>
      <TableCell>{user.saldo_pontos || 0} pts</TableCell>
      <TableCell className="text-right">
        {/* Status specific actions */}
        {user.status === 'pendente' && (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleApproveUser(user.id)}
              title="Aprovar usuário"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleRejectUser(user.id)}
              title="Recusar usuário"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
        
        {/* Dropdown for all users */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Block/Unblock action */}
            {user.status !== 'bloqueado' ? (
              <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                <UserX className="mr-2 h-4 w-4" />
                <span>Bloquear usuário</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Desbloquear usuário</span>
              </DropdownMenuItem>
            )}
            
            {/* Admin status action */}
            {!user.is_admin ? (
              <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Tornar administrador</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleRemoveAdmin(user.id)}>
                <ShieldOff className="mr-2 h-4 w-4" />
                <span>Remover administrador</span>
              </DropdownMenuItem>
            )}
            
            {/* Delete action */}
            <DropdownMenuItem 
              onClick={() => handleDeleteUser(user.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
