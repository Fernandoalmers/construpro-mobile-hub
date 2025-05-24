
import { useEffect, useState } from 'react';
import { useCustomerSelection, usePointsData, useVendorVerification, useDuplicateProtection } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Interface para os resultados de reconciliação
interface ReconciliationResult {
  user_id: string;
  old_balance: number;
  new_balance: number;
  difference: number;
}

export const usePointsAdjustment = () => {
  // Use vendor verification hook
  useVendorVerification();
  
  // Estado para rastrear reconciliações
  const [isReconciling, setIsReconciling] = useState(false);
  
  // Use customer selection hook
  const { 
    selectedCustomerId, 
    selectedCustomer,
    handleSelectCustomer 
  } = useCustomerSelection();
  
  // Use points data hook with the selected customer ID (includes audit functionality)
  const { 
    customerPoints,
    isLoadingPoints,
    adjustments,
    isLoadingAdjustments,
    activeTab,
    setActiveTab,
    handleRefreshData,
    handleAdjustmentSuccess,
    isPointsError,
    pointsError,
    isAdjustmentsError,
    adjustmentsError,
    auditResults,
    handleAutoFixDiscrepancies
  } = usePointsData(selectedCustomerId);
  
  // Use duplicate protection hook
  const { 
    isChecking,
    duplicateCount,
    checkForDuplicates,
    cleanDuplicates
  } = useDuplicateProtection();

  // Função para reconciliar os pontos do cliente selecionado
  const reconcileCustomerPoints = async () => {
    if (!selectedCustomerId) {
      toast.error('Nenhum cliente selecionado');
      return;
    }
    
    setIsReconciling(true);
    try {
      toast.loading('Verificando e reconciliando saldo do cliente...');
      
      const { data, error } = await supabase.rpc('reconcile_user_points', {
        target_user_id: selectedCustomerId
      });
      
      if (error) {
        console.error('Erro ao reconciliar pontos:', error);
        toast.error('Erro ao reconciliar pontos do cliente');
        return;
      }
      
      const result = data as ReconciliationResult[];
      
      if (result.length > 0 && result[0].difference !== 0) {
        toast.success(
          `Saldo reconciliado: ${result[0].old_balance} → ${result[0].new_balance} (diferença: ${result[0].difference})`,
          { duration: 8000 }
        );
        
        // Recarregar os dados após a reconciliação
        handleRefreshData();
      } else {
        toast.success('O saldo do cliente está correto, não há necessidade de reconciliação');
      }
    } catch (err) {
      console.error('Erro em reconcileCustomerPoints:', err);
      toast.error('Erro ao reconciliar pontos do cliente');
    } finally {
      setIsReconciling(false);
    }
  };

  // Debug output of important state for troubleshooting
  useEffect(() => {
    if (selectedCustomerId) {
      console.log('Current hook state:', { 
        selectedCustomerId, 
        customerPoints, 
        adjustmentsCount: adjustments.length,
        isLoadingPoints,
        isLoadingAdjustments,
        duplicateCount,
        isReconciling,
        auditResults,
        isPointsError: isPointsError ? pointsError : null,
        isAdjustmentsError: isAdjustmentsError ? adjustmentsError : null
      });
    }
  }, [
    selectedCustomerId, customerPoints, adjustments, isLoadingPoints, 
    isLoadingAdjustments, isPointsError, isAdjustmentsError, isReconciling,
    pointsError, adjustmentsError, duplicateCount, auditResults
  ]);

  return {
    selectedCustomerId,
    selectedCustomer,
    customerPoints,
    isLoadingPoints,
    adjustments,
    isLoadingAdjustments,
    activeTab,
    setActiveTab,
    handleRefreshData,
    handleSelectCustomer,
    handleAdjustmentSuccess,
    // Expose duplicate protection methods
    isChecking,
    duplicateCount,
    checkForDuplicates,
    cleanDuplicates,
    // Expose reconciliation method
    reconcileCustomerPoints,
    isReconciling,
    // Expose audit functionality
    auditResults,
    handleAutoFixDiscrepancies
  };
};
