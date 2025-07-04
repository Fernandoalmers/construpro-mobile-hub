import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

const TestDataButton: React.FC = () => {
  const { user } = useAuth();

  const createTestData = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Buscar alguns produtos existentes
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id')
        .eq('status', 'aprovado')
        .limit(5);

      if (produtosError) throw produtosError;

      if (!produtos || produtos.length === 0) {
        toast.error('Nenhum produto encontrado');
        return;
      }

      // Criar registros de visualização recente
      const recentViews = produtos.map((produto, index) => ({
        user_id: user.id,
        produto_id: produto.id,
        data_visualizacao: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString() // Últimas horas
      }));

      const { error: insertError } = await supabase
        .from('recently_viewed')
        .upsert(recentViews);

      if (insertError) throw insertError;

      toast.success('Dados de teste criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      toast.error('Erro ao criar dados de teste');
    }
  };

  return (
    <Button
      onClick={createTestData}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      Criar Dados de Teste
    </Button>
  );
};

export default TestDataButton;