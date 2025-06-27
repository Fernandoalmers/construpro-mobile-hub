
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const createSamplePointsTransactions = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔄 [sampleDataService] Creating sample points transactions for user:', userId);
    
    const sampleTransactions = [
      {
        user_id: userId,
        pontos: 50,
        tipo: 'compra',
        descricao: 'Pontos por compra #001',
        data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
        reference_code: 'SAMPLE-001'
      },
      {
        user_id: userId,
        pontos: 100,
        tipo: 'compra',
        descricao: 'Pontos por compra #002',
        data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
        reference_code: 'SAMPLE-002'
      },
      {
        user_id: userId,
        pontos: -30,
        tipo: 'resgate',
        descricao: 'Resgate de produto premium',
        data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
        reference_code: 'SAMPLE-003'
      },
      {
        user_id: userId,
        pontos: 25,
        tipo: 'servico',
        descricao: 'Ajuste manual de pontos',
        data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
        reference_code: 'SAMPLE-004'
      },
      {
        user_id: userId,
        pontos: 75,
        tipo: 'compra',
        descricao: 'Pontos por compra #003',
        data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
        reference_code: 'SAMPLE-005'
      }
    ];
    
    const { error } = await supabase
      .from('points_transactions')
      .insert(sampleTransactions);
      
    if (error) {
      console.error('❌ [sampleDataService] Error creating sample transactions:', error);
      return false;
    }
    
    // Calcular e atualizar o saldo total
    const totalPoints = sampleTransactions.reduce((sum, transaction) => sum + transaction.pontos, 0);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ saldo_pontos: totalPoints })
      .eq('id', userId);
      
    if (profileError) {
      console.error('❌ [sampleDataService] Error updating profile points:', profileError);
      return false;
    }
    
    console.log('✅ [sampleDataService] Sample transactions created successfully');
    return true;
  } catch (error) {
    console.error('❌ [sampleDataService] Exception in createSamplePointsTransactions:', error);
    return false;
  }
};

export const createSampleRewards = async (): Promise<boolean> => {
  try {
    console.log('🔄 [sampleDataService] Creating sample rewards...');
    
    const sampleRewards = [
      {
        item: 'Desconto de R$ 10',
        pontos: 100,
        status: 'ativo',
        categoria: 'Descontos',
        descricao: 'Desconto de R$ 10 para usar em qualquer compra',
        imagem_url: '/img/placeholder.png',
        estoque: 50,
        prazo_entrega: 'Imediato'
      },
      {
        item: 'Produto Premium',
        pontos: 500,
        status: 'ativo',
        categoria: 'Produtos',
        descricao: 'Produto premium exclusivo para membros',
        imagem_url: '/img/placeholder.png',
        estoque: 10,
        prazo_entrega: 'até 7 dias úteis'
      },
      {
        item: 'Frete Grátis',
        pontos: 50,
        status: 'ativo',
        categoria: 'Benefícios',
        descricao: 'Frete grátis para sua próxima compra',
        imagem_url: '/img/placeholder.png',
        estoque: 100,
        prazo_entrega: 'Imediato'
      }
    ];
    
    const { error } = await supabase
      .from('resgates')
      .insert(sampleRewards);
      
    if (error) {
      console.error('❌ [sampleDataService] Error creating sample rewards:', error);
      return false;
    }
    
    console.log('✅ [sampleDataService] Sample rewards created successfully');
    return true;
  } catch (error) {
    console.error('❌ [sampleDataService] Exception in createSampleRewards:', error);
    return false;
  }
};
