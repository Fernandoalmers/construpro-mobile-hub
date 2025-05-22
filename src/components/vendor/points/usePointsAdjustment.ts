
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getCustomerPoints, searchCustomers } from '@/services/vendorService';
import { getPointAdjustments } from '@/services/vendor/points';
import { CustomerData } from './CustomerSearch';
import { toast } from '@/components/ui/sonner';

export const usePointsAdjustment = () => {
  const location = useLocation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);

  // Check for clientId in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clienteId = params.get('clienteId');
    if (clienteId) {
      console.log('Client ID found in URL:', clienteId);
      setSelectedCustomerId(clienteId);
      // Fetch customer data to display
      searchCustomers(clienteId).then(results => {
        console.log('Search results for client ID:', results);
        if (results.length > 0) {
          setSearchResults(results);
          toast.success('Cliente selecionado com sucesso');
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
    queryFn: () => {
      console.log('Fetching points for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return Promise.resolve(0);
      return getCustomerPoints(selectedCustomerId);
    },
    enabled: !!selectedCustomerId,
    staleTime: 10000, // 10 seconds
    retry: 2,
    onError: (error) => {
      console.error('Error fetching customer points:', error);
    }
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
    queryFn: () => {
      console.log('Fetching adjustments for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return Promise.resolve([]);
      return getPointAdjustments(selectedCustomerId);
    },
    enabled: !!selectedCustomerId,
    staleTime: 10000, // 10 seconds
    retry: 2,
    onError: (error) => {
      console.error('Error fetching point adjustments:', error);
    }
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
    setSelectedCustomerId(customer.id);
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
        customerPoints, 
        adjustmentsCount: adjustments.length,
        isLoadingPoints,
        isLoadingAdjustments,
        isPointsError: isPointsError ? pointsError : null,
        isAdjustmentsError: isAdjustmentsError ? adjustmentsError : null
      });
    }
  }, [selectedCustomerId, customerPoints, adjustments, isLoadingPoints, isLoadingAdjustments]);

  return {
    selectedCustomerId,
    selectedCustomer: searchResults.find(c => c.id === selectedCustomerId),
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
