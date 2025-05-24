
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, RefreshCw, Wrench } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConsistencyIssue {
  userId: string;
  userName: string;
  profileBalance: number;
  calculatedBalance: number;
  difference: number;
  duplicateCount: number;
}

const ConsistencyChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);

  const checkConsistency = async () => {
    setIsChecking(true);
    try {
      // Buscar todos os usuários com saldo de pontos
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, saldo_pontos')
        .not('saldo_pontos', 'is', null);

      if (profilesError) throw profilesError;

      const foundIssues: ConsistencyIssue[] = [];

      for (const profile of profiles || []) {
        // Calcular saldo baseado nas transações
        const { data: transactions, error: transError } = await supabase
          .from('points_transactions')
          .select('pontos')
          .eq('user_id', profile.id);

        if (transError) continue;

        const calculatedBalance = transactions?.reduce((sum, t) => sum + t.pontos, 0) || 0;
        const profileBalance = profile.saldo_pontos || 0;
        const difference = profileBalance - calculatedBalance;

        // Verificar duplicatas
        const { data: duplicates } = await supabase.rpc('get_duplicate_transactions');
        const userDuplicates = duplicates?.filter((d: any) => d.user_id === profile.id) || [];

        if (difference !== 0 || userDuplicates.length > 0) {
          foundIssues.push({
            userId: profile.id,
            userName: profile.nome || 'Usuário sem nome',
            profileBalance,
            calculatedBalance,
            difference,
            duplicateCount: userDuplicates.length
          });
        }
      }

      setIssues(foundIssues);

      if (foundIssues.length === 0) {
        toast.success('Nenhuma inconsistência encontrada!');
      } else {
        toast.warning(`Encontradas ${foundIssues.length} inconsistências de saldo`);
      }
    } catch (error) {
      console.error('Erro ao verificar consistência:', error);
      toast.error('Erro ao verificar consistência dos pontos');
    } finally {
      setIsChecking(false);
    }
  };

  const fixAllIssues = async () => {
    setIsFixing(true);
    try {
      let fixedCount = 0;

      for (const issue of issues) {
        // Limpar duplicatas primeiro
        if (issue.duplicateCount > 0) {
          await supabase.rpc('clean_duplicate_transactions_safely');
        }

        // Reconciliar saldo
        const { data: reconcileResult } = await supabase.rpc('reconcile_user_points', {
          target_user_id: issue.userId
        });

        if (reconcileResult && reconcileResult.length > 0) {
          fixedCount++;
        }
      }

      toast.success(`${fixedCount} problemas de saldo foram corrigidos`);
      
      // Re-verificar após correção
      await checkConsistency();
    } catch (error) {
      console.error('Erro ao corrigir problemas:', error);
      toast.error('Erro ao corrigir problemas de saldo');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Verificação de Consistência</h3>
        <div className="flex gap-2">
          <Button
            onClick={checkConsistency}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar'}
          </Button>
          
          {issues.length > 0 && (
            <Button
              onClick={fixAllIssues}
              disabled={isFixing}
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Wrench className={`h-4 w-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
              {isFixing ? 'Corrigindo...' : `Corrigir ${issues.length} problemas`}
            </Button>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center text-green-600 bg-green-50 p-3 rounded">
          <Check className="h-5 w-5 mr-2" />
          <span>Todos os saldos estão consistentes</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{issues.length} inconsistências encontradas</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {issues.map((issue) => (
              <div key={issue.userId} className="bg-gray-50 p-3 rounded text-sm">
                <div className="font-medium">{issue.userName}</div>
                <div className="text-gray-600">
                  Perfil: {issue.profileBalance} | Calculado: {issue.calculatedBalance} 
                  {issue.difference !== 0 && (
                    <span className="text-red-600 font-medium">
                      {' '}(Diferença: {issue.difference})
                    </span>
                  )}
                  {issue.duplicateCount > 0 && (
                    <span className="text-orange-600 font-medium">
                      {' '}• {issue.duplicateCount} duplicatas
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsistencyChecker;
