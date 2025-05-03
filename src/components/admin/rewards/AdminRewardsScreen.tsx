
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';

interface Reward {
  id: string;
  nome: string;
  descricao: string;
  pontos: number;
  imagem_url: string | null;
  categoria: string;
  estoque: number | null;
  created_at: string;
}

const AdminRewardsScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Recompensas');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch rewards from Supabase
  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resgates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Erro ao buscar recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('resgates_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates' 
        }, 
        () => {
          fetchRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRewards = rewards.filter(reward =>
    reward.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reward.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reward.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout currentSection="recompensas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Recompensas</h2>
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Nova Recompensa
          </Button>
        </div>

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
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma recompensa encontrada.' : 'Não há recompensas cadastradas.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">{reward.nome || reward.item}</TableCell>
                      <TableCell>{reward.categoria || 'N/A'}</TableCell>
                      <TableCell>{reward.pontos}</TableCell>
                      <TableCell>{reward.estoque !== null ? reward.estoque : 'Ilimitado'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </AdminLayout>
  );
};

export default AdminRewardsScreen;
