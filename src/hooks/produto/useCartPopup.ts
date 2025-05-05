
import { useState, useEffect, useRef } from 'react';

export function useCartPopup() {
  const [showCartPopup, setShowCartPopup] = useState(false);
  const cartPopupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Clean up timer on unmount
      if (cartPopupTimerRef.current) {
        window.clearTimeout(cartPopupTimerRef.current);
      }
    };
  }, []);

  const handleProductActionSuccess = () => {
    setShowCartPopup(true);
    
    // Clear any existing timer
    if (cartPopupTimerRef.current) {
      window.clearTimeout(cartPopupTimerRef.current);
    }
    
    // Auto-hide popup after 5 seconds
    cartPopupTimerRef.current = window.setTimeout(() => {
      setShowCartPopup(false);
    }, 5000);
  };

  return {
    showCartPopup,
    setShowCartPopup,
    handleProductActionSuccess,
  };
}
