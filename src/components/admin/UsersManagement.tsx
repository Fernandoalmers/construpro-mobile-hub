
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Check, X, User, Search, 
  Filter, Edit, Trash2, UserCheck 
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface UserData {
  id: string;
  nome: string;
  email?: string;
  cpf?: string;
  papel: string;
  saldoPontos: number;
  status?: string;
  avatar?: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Get profile data from Supabase
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          throw profilesError;
        }

        // For now, we'll merge with our mock data to get additional fields
        // In a real app, these would all be in your database
        const mockData = (await import('../../data/clientes.json')).default;

        // Combine data sources
        const combinedData = profilesData.map((profile: any) => {
          const mockUser = mockData.find(mock => mock.id === profile.id);
          return {
            ...mockUser,
            ...profile,
            nome: profile.nome || mockUser?.nome || 'Usuário',
            papel: profile.papel || mockUser?.papel || 'consumidor',
            saldoPontos: profile.saldo_pontos || mockUser?.saldoPontos || 0,
            status: 'ativo' // Default status
          };
        });

        setUsers(combinedData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
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
    try {
      // In a real app, update the user status in database
      // For now we'll just update the local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'ativo' } : user
        )
      );
      
      // Log admin action - in real app, call Supabase RPC
      console.log('Admin action: Approve user', userId);
      
      toast.success('Usuário aprovado com sucesso');
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      // In a real app, update the user status in database
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'recusado' } : user
        )
      );
      
      toast.success('Usuário recusado');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erro ao recusar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      // In a real app, delete the user from database
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userId)
      );
      
      toast.success('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'profissional': return 'bg-blue-100 text-blue-800';
      case 'lojista': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-amber-100 text-amber-800';
      case 'recusado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CPF"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="consumidor">Consumidor</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="lojista">Lojista</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
              <p className="mt-2 text-gray-500">Carregando usuários...</p>
            </div>
          ) : (
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
                          <Badge className={getRoleBadgeColor(user.papel)}>
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

export default UsersManagement;
