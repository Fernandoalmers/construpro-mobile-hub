
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

import CustomerSearch from './points/CustomerSearch';
import CustomerInfo from './points/CustomerInfo';
import PointsAdjustmentForm from './points/PointsAdjustmentForm';
import PointsAdjustmentHistory from './points/PointsAdjustmentHistory';
import EmptyCustomerState from './points/EmptyCustomerState';
import ConsistencyChecker from './points/ConsistencyChecker';
import { usePointsAdjustment } from './points/usePointsAdjustment';
import { deployPointsRpcFunctions } from '@/services/vendor/points/deployRpcFunctions';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const AjustePontosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const {
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
    // Duplicate protection features
    duplicateCount,
    checkForDuplicates,
    cleanDuplicates,
    // Reconciliation feature
    reconcileCustomerPoints,
    isReconciling,
    // Audit features
    auditResults,
    handleAutoFixDiscrepancies
  } = usePointsAdjustment();

  // Deploy RPC functions when component mounts
  useEffect(() => {
    const setupRpcFunctions = async () => {
      await deployPointsRpcFunctions();
    };
    
    setupRpcFunctions().catch(console.error);
  }, []);
  
  // For admins, check for duplicate transactions on mount
  useEffect(() => {
    const checkForDuplicatesOnMount = async () => {
      if (!isAdmin) return;
      
      try {
        // Check for duplicate transactions
        const { data, error } = await supabase.functions.invoke('clean-duplicate-transactions', {
          method: 'POST',
          body: { dryRun: true }
        });
        
        if (error) {
          console.error('Error checking for duplicates:', error);
          return;
        }
        
        if (data?.duplicates?.length > 0) {
          toast.info(
            `Foram encontradas ${data.duplicates.length} transações duplicadas que podem ser removidas.`, 
            { 
              duration: 8000,
              action: {
                label: "Limpar agora",
                onClick: () => cleanDuplicates()
              }
            }
          );
        }
      } catch (err) {
        console.error('Error in checkForDuplicatesOnMount:', err);
      }
    };
    
    // Add a small delay to prevent overwhelming the user with notifications
    const timer = setTimeout(() => {
      checkForDuplicatesOnMount();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isAdmin, cleanDuplicates]);

  // Display a toast message once when the component mounts
  useEffect(() => {
    // Add a small delay to ensure the toast shows after UI renders
    const timer = setTimeout(() => {
      toast.info(
        'Busque um cliente pelo nome, CPF, telefone ou email para ajustar seus pontos.',
        { duration: 5000 }
      );
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if there are audit issues
  const hasAuditIssues = auditResults && (
    auditResults.difference !== 0 || 
    auditResults.duplicateTransactions > 0 ||
    auditResults.status === 'discrepancy'
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button 
          onClick={() => navigate('/vendor')} 
          className="mr-4 hover:bg-gray-100 p-2 rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Ajuste de Pontos</h1>
        
        {/* Show admin tools and audit alerts */}
        <div className="ml-auto flex gap-2 items-center">
          {/* Alert for audit issues */}
          {hasAuditIssues && (
            <Button 
              size="sm"
              variant="outline"
              onClick={handleAutoFixDiscrepancies}
              className="flex items-center gap-1 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> 
              Corrigir discrepâncias
            </Button>
          )}

          {isAdmin && selectedCustomerId && (
            <Button 
              size="sm"
              variant="outline"
              onClick={reconcileCustomerPoints}
              disabled={isReconciling}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> 
              {isReconciling ? 'Reconciliando...' : 'Reconciliar Saldo'}
            </Button>
          )}
          
          {isAdmin && duplicateCount > 0 && (
            <span 
              onClick={() => cleanDuplicates()} 
              className="text-xs bg-amber-100 text-amber-800 py-1 px-2 rounded-full cursor-pointer"
            >
              {duplicateCount} duplicatas encontradas
            </span>
          )}
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Admin Consistency Checker */}
        {isAdmin && (
          <ConsistencyChecker />
        )}

        {/* Client Search Card */}
        <Card className="overflow-visible">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Buscar cliente</h2>
          </div>
          <CustomerSearch onSelectCustomer={handleSelectCustomer} />
        </Card>
        
        {/* Selected Client Information */}
        {selectedCustomerId && selectedCustomer && (
          <Card className="overflow-hidden">
            <CustomerInfo 
              customer={selectedCustomer}
              customerPoints={customerPoints}
              isLoadingPoints={isLoadingPoints}
              onRefreshData={handleRefreshData}
              auditResults={auditResults}
              onAutoFix={handleAutoFixDiscrepancies}
            />
  
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Ajustar Pontos</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
              </div>
  
              <TabsContent value="form" className="focus:outline-none">
                <PointsAdjustmentForm 
                  customerId={selectedCustomerId}
                  customerPoints={customerPoints}
                  onSuccess={handleAdjustmentSuccess}
                />
              </TabsContent>
              
              <TabsContent value="history" className="focus:outline-none">
                <PointsAdjustmentHistory 
                  adjustments={adjustments}
                  isLoading={isLoadingAdjustments}
                  onRefresh={handleRefreshData}
                />
              </TabsContent>
            </Tabs>
          </Card>
        )}
  
        {/* Instructions when no customer is selected */}
        {!selectedCustomerId && <EmptyCustomerState />}
      </div>
    </div>
  );
};

export default AjustePontosVendorScreen;
