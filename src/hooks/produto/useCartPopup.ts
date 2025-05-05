
import { useState, useEffect, useRef } from 'react';

export function useCartPopup() {
  const [showCartPopup, setShowCartPopup] = useState(false);
  const cartPopupTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Clean up timer on unmount
      if (cartPopupTimerRef.current) {
        window.clearTimeout(cartPopupTimerRef.current);
      }
    };
  }, []);

  const handleProductActionSuccess = () => {
    console.log("useCartPopup: Showing cart popup after successful action");
    setShowCartPopup(true);
    
    // Clear any existing timer
    if (cartPopupTimerRef.current) {
      window.clearTimeout(cartPopupTimerRef.current);
    }
    
    // Auto-hide popup after 5 seconds
    cartPopupTimerRef.current = window.setTimeout(() => {
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
