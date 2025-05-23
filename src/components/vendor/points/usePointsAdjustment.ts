
import { useEffect } from 'react';
import { useCustomerSelection, usePointsData, useVendorVerification, useDuplicateProtection } from './hooks';

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
  
  // Use duplicate protection hook
  const { 
    isChecking,
    duplicateCount,
    checkForDuplicates,
    cleanDuplicates
  } = useDuplicateProtection();

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
        isPointsError: isPointsError ? pointsError : null,
        isAdjustmentsError: isAdjustmentsError ? adjustmentsError : null
      });
    }
  }, [
    selectedCustomerId, customerPoints, adjustments, isLoadingPoints, 
    isLoadingAdjustments, isPointsError, isAdjustmentsError, 
    pointsError, adjustmentsError, duplicateCount
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
    cleanDuplicates
  };
};
