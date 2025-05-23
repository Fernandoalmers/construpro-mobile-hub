
import { useEffect } from 'react';
import { useCustomerSelection, usePointsData, useVendorVerification } from './hooks';

export const usePointsAdjustment = () => {
  // Use vendor verification hook
  useVendorVerification();
  
  // Use customer selection hook
  const { 
    selectedCustomerId, 
    selectedCustomer,
    handleSelectCustomer 
  } = useCustomerSelection();
  
  // Use points data hook with the selected customer ID
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
    adjustmentsError
  } = usePointsData(selectedCustomerId);

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
  }, [selectedCustomerId, customerPoints, adjustments, isLoadingPoints, isLoadingAdjustments, isPointsError, isAdjustmentsError, pointsError, adjustmentsError]);

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
    handleAdjustmentSuccess
  };
};
