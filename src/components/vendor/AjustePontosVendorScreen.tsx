
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

import CustomerSearch from './points/CustomerSearch';
import CustomerInfo from './points/CustomerInfo';
import PointsAdjustmentForm from './points/PointsAdjustmentForm';
import PointsAdjustmentHistory from './points/PointsAdjustmentHistory';
import EmptyCustomerState from './points/EmptyCustomerState';
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
    handleAdjustmentSuccess
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
    const checkForDuplicates = async () => {
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
                label: "Saiba mais",
                onClick: () => toast.info(
                  "Use os controles de administração no formulário de ajuste para verificar e remover duplicações."
                )
              }
            }
          );
        }
      } catch (err) {
        console.error('Error in checkForDuplicates:', err);
      }
    };
    
    checkForDuplicates();
  }, [isAdmin]);

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
      </div>
      
      <div className="max-w-3xl mx-auto p-4 space-y-4">
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
