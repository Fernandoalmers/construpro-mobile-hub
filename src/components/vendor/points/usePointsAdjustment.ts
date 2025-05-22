
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getCustomerPoints, searchCustomers } from '@/services/vendorService';
import { getPointAdjustments } from '@/services/vendor/points/adjustmentsFetcher';
import { CustomerData } from './CustomerSearch';
import { toast } from '@/components/ui/sonner';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';

export const usePointsAdjustment = () => {
  const location = useLocation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [relationId, setRelationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);

  // Check vendor role on component mount
  useEffect(() => {
    const verifyVendorRole = async () => {
      try {
        await ensureVendorProfileRole();
      } catch (error) {
        console.error('Error verifying vendor role:', error);
        toast.error('Erro ao verificar perfil de vendedor');
      }
    };
    
    verifyVendorRole();
  }, []);

  // Check for clientId in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clienteId = params.get('customerId') || params.get('clienteId');
    if (clienteId) {
      console.log('Client ID found in URL:', clienteId);
      
      // Search for the customer to get the usuario_id
      searchCustomers(clienteId).then(results => {
        console.log('Search results for client ID:', results);
        if (results && results.length > 0) {
          // Map to ensure it matches CustomerData interface
          const customerData: CustomerData[] = results.map(customer => ({
            id: customer.id,
            nome: customer.nome || 'Usuário',
            telefone: customer.telefone,
            email: customer.email,
            cpf: customer.cpf,
            usuario_id: customer.usuario_id,
            vendedor_id: customer.vendedor_id,
            total_gasto: customer.total_gasto || 0
          }));
          
          setSearchResults(customerData);
          
          // Use the usuario_id for the profile operations
          if (customerData[0]?.usuario_id) {
            setSelectedCustomerId(customerData[0].usuario_id);
            setRelationId(customerData[0].id);
            toast.success('Cliente selecionado com sucesso');
          } else {
            toast.error('Cliente não encontrado ou sem ID de usuário');
          }
        } else {
          toast.error('Cliente não encontrado');
        }
      }).catch(error => {
        console.error('Error fetching customer details:', error);
        toast.error('Erro ao buscar detalhes do cliente');
      });
    }
  }, [location]);

  // Get customer's points
  const { 
    data: customerPoints = 0, 
    isLoading: isLoadingPoints, 
    refetch: refetchPoints,
    isError: isPointsError,
    error: pointsError
  } = useQuery({
    queryKey: ['customerPoints', selectedCustomerId],
    queryFn: async () => {
      console.log('Fetching points for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return 0;
      try {
        return await getCustomerPoints(selectedCustomerId);
      } catch (error) {
        console.error('Error fetching customer points:', error);
        toast.error('Erro ao buscar pontos do cliente');
        return 0;
      }
    },
    enabled: !!selectedCustomerId,
    staleTime: 10000, // 10 seconds
    retry: 2
  });

  // Get point adjustments history for the selected customer
  const { 
    data: adjustments = [], 
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments,
    isError: isAdjustmentsError,
    error: adjustmentsError
  } = useQuery({
    queryKey: ['pointAdjustments', selectedCustomerId],
    queryFn: async () => {
      console.log('Fetching adjustments for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return [];
      try {
        return await getPointAdjustments(selectedCustomerId);
      } catch (error) {
        console.error('Error fetching point adjustments:', error);
        toast.error('Erro ao buscar histórico de ajustes');
        return [];
      }
    },
    enabled: !!selectedCustomerId,
    staleTime: 10000, // 10 seconds
    retry: 2
  });

  // Handle manual refresh of data
  const handleRefreshData = () => {
    if (selectedCustomerId) {
      console.log('Manually refreshing data for customer:', selectedCustomerId);
      refetchPoints();
      refetchAdjustments();
      toast.success('Dados atualizados');
    }
  };

  const handleSelectCustomer = (customer: CustomerData) => {
    console.log('Selected customer in hook:', customer);
    
    // Validate and use the usuario_id (profile ID) for operations, not the relation ID
    if (!customer.usuario_id) {
      console.error('Error: Customer has no valid usuario_id:', customer);
      toast.error('Este cliente não tem um ID de usuário válido');
      return;
    }
    
    // Store both IDs separately
    setRelationId(customer.id);
    setSelectedCustomerId(customer.usuario_id);
    
    setSearchResults([customer]);
    // Switch to form tab when a customer is selected
    setActiveTab('form');
    toast.success(`Cliente ${customer.nome} selecionado`);
  };

  const handleAdjustmentSuccess = () => {
    // Switch to history tab after successful adjustment
    setTimeout(() => {
      refetchPoints();
      refetchAdjustments();
      setActiveTab('history');
    }, 500);
  };

  // Debug output of important state for troubleshooting
  useEffect(() => {
    if (selectedCustomerId) {
      console.log('Current hook state:', { 
        selectedCustomerId, 
        relationId,
        customerPoints, 
        adjustmentsCount: adjustments.length,
        isLoadingPoints,
        isLoadingAdjustments,
        isPointsError: isPointsError ? pointsError : null,
        isAdjustmentsError: isAdjustmentsError ? adjustmentsError : null
      });
    }
  }, [selectedCustomerId, relationId, customerPoints, adjustments, isLoadingPoints, isLoadingAdjustments, isPointsError, isAdjustmentsError, pointsError, adjustmentsError]);

  return {
    selectedCustomerId,
    selectedCustomer: searchResults.find(c => c.id === relationId),
    customerPoints,
    isLoadingPoints,
    adjustments,
    isLoadingAdjustments,
    activeTab,
    setActiveTab,
    handleRefreshData,
    handleSelectCustomer,
    handleAdjustmentSuccess
  };
};
