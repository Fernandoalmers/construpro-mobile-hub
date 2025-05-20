
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getCustomerPoints, getPointAdjustments, searchCustomers } from '@/services/vendorService';
import { CustomerData } from './CustomerSearch';

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
      setSelectedCustomerId(clienteId);
      // Fetch customer data to display
      searchCustomers(clienteId).then(results => {
        if (results.length > 0) {
          setSearchResults(results);
        }
      }).catch(error => {
        console.error('Error fetching customer details:', error);
      });
    }
  }, [location]);

  // Get customer's points with frequent refreshes
  const { 
    data: customerPoints = 0, 
    isLoading: isLoadingPoints, 
    refetch: refetchPoints 
  } = useQuery({
    queryKey: ['customerPoints', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getCustomerPoints(selectedCustomerId) : Promise.resolve(0),
    enabled: !!selectedCustomerId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get point adjustments history for the selected customer
  const { 
    data: adjustments = [], 
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments
  } = useQuery({
    queryKey: ['pointAdjustments', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getPointAdjustments(selectedCustomerId) : Promise.resolve([]),
    enabled: !!selectedCustomerId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Handle manual refresh of data
  const handleRefreshData = () => {
    if (selectedCustomerId) {
      refetchPoints();
      refetchAdjustments();
    }
  };

  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomerId(customer.id);
    setSearchResults([customer]);
    // Switch to form tab when a customer is selected
    setActiveTab('form');
  };

  const handleAdjustmentSuccess = () => {
    // Switch to history tab after successful adjustment
    setTimeout(() => {
      refetchPoints();
      refetchAdjustments();
      setActiveTab('history');
    }, 500);
  };

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
