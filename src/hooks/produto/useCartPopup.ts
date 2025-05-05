
import { useState, useEffect, useRef } from 'react';

export function useCartPopup() {
  const [showCartPopup, setShowCartPopup] = useState(false);
  const cartPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      // Clean up timer on unmount
      if (cartPopupTimerRef.current) {
        clearTimeout(cartPopupTimerRef.current);
      }
    };
  }, []);

  const handleProductActionSuccess = () => {
    console.log("useCartPopup: Showing cart popup after successful action");
    setShowCartPopup(true);
    
    // Clear any existing timer
    if (cartPopupTimerRef.current) {
      clearTimeout(cartPopupTimerRef.current);
    }
    
    // Auto-hide popup after 5 seconds
    cartPopupTimerRef.current = setTimeout(() => {
      console.log("useCartPopup: Auto-hiding cart popup after timeout");
      setShowCartPopup(false);
    }, 5000);
  };

  return {
    showCartPopup,
    setShowCartPopup,
    handleProductActionSuccess,
  };
}
