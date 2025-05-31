
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, CheckCircle, XCircle, Lock, Unlock, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserData } from '@/types/admin';
import { securityService } from '@/services/securityService';

interface UserTableRowProps {
  user: UserData;
  handleApproveUser: (userId: string) => Promise<void>;
  handleRejectUser: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleBlockUser: (userId: string) => Promise<void>;
  handleUnblockUser: (userId: string) => Promise<void>;
  handleMakeAdmin: (userId: string) => Promise<void>;
  handleRemoveAdmin: (userId: string) => Promise<void>;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  handleApproveUser,
  handleRejectUser,
  handleDeleteUser,
  handleBlockUser,
  handleUnblockUser,
  handleMakeAdmin,
  handleRemoveAdmin,
  getRoleBadgeColor,
  getStatusBadgeColor
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Log detalhado para VERIFICAR se os dados estão chegando CORRETAMENTE
  console.log(`🔍 [UserTableRow] DADOS COMPLETOS para ${user.nome}:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Código indicação: "${user.codigo_indicacao}" (existe: ${!!user.codigo_indicacao})`);
  console.log(`   - Indicado por: "${user.indicado_por}" (existe: ${!!user.indicado_por})`);
  console.log(`   - Especialidade: "${user.especialidade}" (existe: ${!!user.especialidade})`);
  console.log(`   - Total compras: ${user.total_compras} (existe: ${!!user.total_compras})`);
  console.log(`   - Objeto COMPLETO:`, {
    id: user.id,
    nome: user.nome,
    codigo_indicacao: user.codigo_indicacao,
    indicado_por: user.indicado_por,
    especialidade: user.especialidade,
    total_compras: user.total_compras
  });

  // Verificar se Fernando Almeida tem os dados esperados
  if (user.nome?.includes('Fernando')) {
    console.log('🎯 [FERNANDO ALMEIDA] Verificação específica:');
    console.log('   - Código esperado: NWZL01');
    console.log('   - Código recebido:', user.codigo_indicacao);
    console.log('   - Total esperado: R$ 3.449,23');
    console.log('   - Total recebido:', user.total_compras);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Secure admin promotion using the new security service
  const handleSecureMakeAdmin = async () => {
    setIsProcessing(true);
    try {
      const result = await securityService.promoteUserToAdmin(user.id, 'Promoted via admin interface');
      if (result.success) {
        // Call the original handler to update the UI
        await handleMakeAdmin(user.id);
      }
    } finally {
      setIsProcessing(false);
      setIsMenuOpen(false);
    }
  };

  // Secure admin demotion using the new security service
  const handleSecureRemoveAdmin = async () => {
    setIsProcessing(true);
    try {
      const result = await securityService.demoteUserFromAdmin(user.id, 'Demoted via admin interface');
      if (result.success) {
        // Call the original handler to update the UI
        await handleRemoveAdmin(user.id);
      }
    } finally {
      setIsProcessing(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 rounded-full">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.nome || 'User avatar'} />
            ) : (
              <AvatarFallback>{user.nome?.[0] || 'U'}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-medium">{user.nome || 'Usuário'}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2">{user.cpf || '-'}</td>
      <td className="px-4 py-2">{user.telefone || '-'}</td>
      <td className="px-4 py-2">
        <Badge className={getRoleBadgeColor(user.papel || 'consumidor')}>
          {user.papel || 'consumidor'}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <Badge className={getStatusBadgeColor(user.status || 'ativo')}>
          {user.status || 'ativo'}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <span className="text-sm font-mono text-blue-600">
          {user.codigo_indicacao || '-'}
        </span>
      </td>
      <td className="px-4 py-2">
        <span className="text-sm text-gray-700">
          {user.indicado_por || '-'}
        </span>
      </td>
      <td className="px-4 py-2">
        <span className="text-sm text-gray-700">
          {user.especialidade || '-'}
        </span>
      </td>
      <td className="px-4 py-2 text-right">{user.saldo_pontos || 0}</td>
      <td className="px-4 py-2 text-right">
        <span className="text-sm font-semibold text-green-600">
          R$ {(user.total_compras || 0).toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-2 text-right relative">
        <div ref={menuRef}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isProcessing}
          >
            <span className="sr-only">Abrir menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-10">
              <div className="rounded-md ring-1 ring-black ring-opacity-5 p-1">
                {user.status === 'pendente' && (
                  <>
                    <Button 
                      className="w-full justify-start text-sm" 
                      variant="ghost" 
                      onClick={() => {
                        handleApproveUser(user.id);
                        setIsMenuOpen(false);
                      }}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Aprovar usuário
                    </Button>
                    <Button 
                      className="w-full justify-start text-sm" 
                      variant="ghost" 
                      onClick={() => {
                        handleRejectUser(user.id);
                        setIsMenuOpen(false);
                      }}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Recusar usuário
                    </Button>
                  </>
                )}
                {user.status === 'ativo' && (
                  <Button 
                    className="w-full justify-start text-sm" 
                    variant="ghost" 
                    onClick={() => {
                      handleBlockUser(user.id);
                      setIsMenuOpen(false);
                    }}
                    disabled={isProcessing}
                  >
                    <Lock className="mr-2 h-4 w-4" /> Bloquear usuário
                  </Button>
                )}
                {user.status === 'bloqueado' && (
                  <Button 
                    className="w-full justify-start text-sm" 
                    variant="ghost" 
                    onClick={() => {
                      handleUnblockUser(user.id);
                      setIsMenuOpen(false);
                    }}
                    disabled={isProcessing}
                  >
                    <Unlock className="mr-2 h-4 w-4" /> Desbloquear usuário
                  </Button>
                )}
                {!user.is_admin && (
                  <Button 
                    className="w-full justify-start text-sm" 
                    variant="ghost" 
                    onClick={handleSecureMakeAdmin}
                    disabled={isProcessing}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" /> 
                    {isProcessing ? 'Processando...' : 'Tornar administrador'}
                  </Button>
                )}
                {user.is_admin && (
                  <Button 
                    className="w-full justify-start text-sm" 
                    variant="ghost" 
                    onClick={handleSecureRemoveAdmin}
                    disabled={isProcessing}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" /> 
                    {isProcessing ? 'Processando...' : 'Remover administrador'}
                  </Button>
                )}
                <Button 
                  className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-100" 
                  variant="ghost" 
                  onClick={() => {
                    setIsDeleteModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  disabled={isProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir usuário
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Delete confirmation modal */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
                e todos os seus dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  handleDeleteUser(user.id);
                  setIsDeleteModalOpen(false);
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
};

export default UserTableRow;
