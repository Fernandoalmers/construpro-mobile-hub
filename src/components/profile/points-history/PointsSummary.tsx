
import React, { useEffect, useState } from 'react';
import Card from '../../common/Card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CircleDollarSign, RefreshCw, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { usePointsAudit } from '@/components/vendor/points/hooks/usePointsAudit';
import { supabase } from '@/integrations/supabase/client';

interface PointsSummaryProps {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  onRefresh: () => void;
}

const PointsSummary: React.FC<PointsSummaryProps> = ({
  totalPoints,
  totalEarned,
  totalRedeemed,
  onRefresh,
}) => {
  const { isAuditing, auditResults, auditUserPoints, autoFixDiscrepancies, calculateTransactionSummary } = usePointsAudit();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<{
    totalEarned: number;
    totalRedeemed: number;
    netBalance: number;
  } | null>(null);

  // Obter o ID do usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fazer auditoria automática quando o componente montar
  useEffect(() => {
    if (currentUserId) {
      auditUserPoints(currentUserId);
      calculateTransactionSummary(currentUserId).then(setTransactionSummary);
    }
  }, [currentUserId, auditUserPoints, calculateTransactionSummary]);

  const handleRefreshWithAudit = async () => {
    onRefresh();
    if (currentUserId) {
      await auditUserPoints(currentUserId);
      const summary = await calculateTransactionSummary(currentUserId);
      setTransactionSummary(summary);
    }
    toast.success('Dados atualizados e verificados');
  };

  const handleAutoFix = async () => {
    if (!currentUserId) return;
    
    try {
      await autoFixDiscrepancies(currentUserId);
      onRefresh(); // Atualizar dados na tela
      const summary = await calculateTransactionSummary(currentUserId);
      setTransactionSummary(summary);
    } catch (error) {
      console.error('Erro ao corrigir automaticamente:', error);
    }
  };

  // Determinar se há discrepâncias
  const hasDiscrepancies = auditResults && (
    auditResults.difference !== 0 || 
    auditResults.duplicateTransactions > 0 ||
    auditResults.status === 'discrepancy'
  );

  // Usar dados das transações calculados se disponíveis, senão usar os props
  const displayTotalEarned = transactionSummary?.totalEarned ?? auditResults?.details?.totalEarned ?? totalEarned;
  const displayTotalRedeemed = transactionSummary?.totalRedeemed ?? auditResults?.details?.totalRedeemed ?? totalRedeemed;
  const calculatedBalance = transactionSummary?.netBalance ?? auditResults?.transactionBalance ?? totalPoints;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-600">Saldo atual</h3>
        {auditResults && (
          <div className="flex items-center">
            {hasDiscrepancies ? (
              <div className="flex items-center text-amber-600">
                <AlertTriangle size={16} className="mr-1" />
                <span className="text-xs">Discrepância detectada</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-xs">Saldo verificado</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-baseline">
        <CircleDollarSign size={28} className="text-construPro-orange mr-2" />
        <span className="text-3xl font-bold">{totalPoints}</span>
        <span className="ml-1 text-gray-600">pontos</span>
        {auditResults && auditResults.difference !== 0 && (
          <span className="ml-2 text-xs text-amber-600">
            (Calculado: {auditResults.transactionBalance})
          </span>
        )}
      </div>

      {/* Mostrar informações de auditoria se houver discrepâncias */}
      {hasDiscrepancies && auditResults && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
          <div className="font-medium text-amber-800">Problemas detectados:</div>
          {auditResults.difference !== 0 && (
            <div className="text-amber-700">
              • Diferença de saldo: {auditResults.difference} pontos
            </div>
          )}
          {auditResults.duplicateTransactions > 0 && (
            <div className="text-amber-700">
              • {auditResults.duplicateTransactions} transações duplicadas
            </div>
          )}
          <div className="text-amber-600 mt-1">
            Saldo do perfil: {auditResults.profileBalance} | Calculado: {auditResults.transactionBalance}
          </div>
        </div>
      )}
      
      <Separator className="my-3" />
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Total ganho</p>
          <p className="font-medium text-green-600">+{displayTotalEarned} pontos</p>
        </div>
        <div>
          <p className="text-gray-500">Total resgatado</p>
          <p className="font-medium text-red-600">-{displayTotalRedeemed} pontos</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshWithAudit}
          disabled={isAuditing}
          className="flex-1 flex items-center justify-center"
        >
          <RefreshCw size={14} className="mr-2" />
          {isAuditing ? 'Verificando...' : 'Atualizar e verificar'}
        </Button>
        
        {hasDiscrepancies && (
          <Button 
            variant="default" 
            size="sm"
            onClick={handleAutoFix}
            disabled={isAuditing}
            className="flex-1 flex items-center justify-center bg-amber-600 hover:bg-amber-700"
          >
            <Wrench size={14} className="mr-2" />
            Corrigir automaticamente
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PointsSummary;
