
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash, Gift, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import { AdminReward } from '@/types/admin';
import { fetchRewards, toggleRewardStatus, deleteReward } from '@/services/adminRewardsService';
import CustomModal from '@/components/common/CustomModal';
import RewardForm from './RewardForm';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import ListEmptyState from '@/components/common/ListEmptyState';

const AdminRewardsScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Recompensas');
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<AdminReward | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch rewards from Supabase
  const loadRewards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rewardsData = await fetchRewards();
      console.log('Admin rewards loaded:', rewardsData); // Debug log
      setRewards(rewardsData);
      
      if (rewardsData.length === 0) {
        console.log('No rewards found in the database');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setError('Erro ao buscar recompensas. Tente novamente mais tarde.');
      toast.error('Erro ao buscar recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('resgates_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates' 
        }, 
        (payload) => {
          console.log('Realtime admin rewards update received:', payload);
          loadRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleStatus = async (reward: AdminReward) => {
    try {
      const success = await toggleRewardStatus(reward.id, reward.status);
      if (success) {
        loadRewards();
      }
    } catch (error) {
      console.error('Error toggling reward status:', error);
      toast.error('Erro ao alterar status da recompensa');
    }
  };

  const confirmToggleStatus = (reward: AdminReward) => {
    const newStatus = reward.status === 'ativo' ? 'inativo' : 'ativo';
    const confirmMessage = `Tem certeza que deseja ${
      newStatus === 'ativo' ? 'ativar' : 'desativar'
    } esta recompensa?`;
    
    if (window.confirm(confirmMessage)) {
      handleToggleStatus(reward);
    }
  };

  const handleEditReward = (reward: AdminReward) => {
    setSelectedReward(reward);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = (reward: AdminReward) => {
    setSelectedReward(reward);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteReward = async () => {
    if (!selectedReward) return;
    
    try {
      const success = await deleteReward(selectedReward.id);
      if (success) {
        setIsDeleteModalOpen(false);
        loadRewards();
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Erro ao excluir recompensa');
    }
  };

  const handleCreateReward = () => {
    setIsCreateModalOpen(true);
  };

  const filteredRewards = rewards.filter(reward =>
    reward.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reward.descricao && reward.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (reward.categoria && reward.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500 hover:bg-green-600';
      case 'inativo':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'pendente':
      default:
        return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  return (
    <AdminLayout currentSection="recompensas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Recompensas</h2>
          <Button className="flex items-center gap-1" onClick={handleCreateReward}>
            <Plus className="h-4 w-4" /> Nova Recompensa
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{error}</span>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recompensas Disponíveis</CardTitle>
            <div className="relative flex items-center mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recompensas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState text="Carregando recompensas..." />
            ) : filteredRewards.length === 0 ? (
              <ListEmptyState 
                icon={<Gift size={40} className="text-gray-400" />}
                title={searchTerm ? "Nenhuma recompensa encontrada" : "Não há recompensas cadastradas"}
                description={searchTerm 
                  ? "Nenhuma recompensa corresponde à sua busca. Tente usar termos diferentes."
                  : "Você ainda não cadastrou nenhuma recompensa. Clique no botão abaixo para adicionar sua primeira recompensa."
                }
                action={{
                  label: "Criar nova recompensa",
                  onClick: handleCreateReward
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        {reward.imagem_url ? (
                          <img 
                            src={reward.imagem_url} 
                            alt={reward.nome} 
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                            <Gift size={20} className="text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{reward.nome}</TableCell>
                      <TableCell>{reward.categoria || 'N/A'}</TableCell>
                      <TableCell>{reward.pontos}</TableCell>
                      <TableCell>{reward.estoque !== null ? reward.estoque : 'Ilimitado'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(reward.status)}>
                          {reward.status === 'ativo' ? 'Ativo' : 
                           reward.status === 'inativo' ? 'Inativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditReward(reward)}
                            title="Editar recompensa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteConfirm(reward)}
                            title="Excluir recompensa"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={reward.status === 'ativo'}
                            onCheckedChange={() => confirmToggleStatus(reward)}
                            className="ml-2"
                            title={reward.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para criação de nova recompensa */}
      <CustomModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Recompensa"
        description="Preencha os dados para criar uma nova recompensa"
        size="lg"
      >
        <RewardForm
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadRewards();
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </CustomModal>

      {/* Modal para edição de recompensa */}
      <CustomModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Recompensa"
        description="Atualize os dados da recompensa"
        size="lg"
      >
        {selectedReward && (
          <RewardForm
            initialData={selectedReward}
            onSuccess={() => {
              setIsEditModalOpen(false);
              loadRewards();
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </CustomModal>

      {/* Modal para confirmação de exclusão */}
      <CustomModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Excluir Recompensa"
        description="Tem certeza que deseja excluir esta recompensa? Esta ação não pode ser desfeita."
        showFooterButtons
        onConfirm={handleDeleteReward}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
      >
        {selectedReward && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
            {selectedReward.imagem_url ? (
              <img 
                src={selectedReward.imagem_url} 
                alt={selectedReward.nome} 
                className="h-16 w-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80';
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                <Gift size={24} className="text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{selectedReward.nome}</h3>
              <p className="text-sm text-gray-600">{selectedReward.pontos} pontos</p>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
};

export default AdminRewardsScreen;
