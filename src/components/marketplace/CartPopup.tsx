import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
interface CartPopupProps {
  triggerShow?: boolean;
}
const CartPopup: React.FC<CartPopupProps> = ({
  triggerShow
}) => {
  const [show, setShow] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Try to access cart context, but with error handling
  let cartContextValues;
  try {
    cartContextValues = useCart();

    // If we successfully get the cart context, update our state
    useEffect(() => {
      if (cartContextValues) {
        console.log('CartPopup: Cart context values:', {
          cartCount: cartContextValues.cartCount,
          isLoading: cartContextValues.isLoading
        });
        setCartCount(cartContextValues.cartCount || 0);
        setIsLoading(cartContextValues.isLoading || false);
      }
    }, [cartContextValues.cartCount, cartContextValues.isLoading]);
  } catch (error) {
    // If useCart throws an error (no provider), we'll use our local state instead
    console.log('CartPopup: Cart context not available, using fallback values');

    // Try to get cart count from localStorage
    useEffect(() => {
      try {
        const storedCartData = localStorage.getItem('cartData');
        if (storedCartData) {
          const cartData = JSON.parse(storedCartData);
          if (cartData && cartData.summary && typeof cartData.summary.totalItems === 'number') {
            setCartCount(cartData.summary.totalItems);
          }
        }
      } catch (error) {
        console.error("Error reading cart data:", error);
      }
    }, []);
  }

  // Clear any existing timer when component unmounts or when we show/hide the popup
  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [show]);

  // Show popup when triggerShow changes to true or when items are added to cart
  useEffect(() => {
    console.log('CartPopup: triggerShow changed:', triggerShow, 'cartCount:', cartCount, 'isLoading:', isLoading);
    if (triggerShow === true) {
      console.log('CartPopup: Setting show to true based on triggerShow');
      setShow(true);

      // Clear any existing timer
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }

      // Set new timer
      popupTimerRef.current = setTimeout(() => {
        console.log('CartPopup: Auto-hiding popup after timeout');
        setShow(false);
      }, 5000); // 5 seconds for better visibility
    }
  }, [triggerShow, cartCount, isLoading]);

  // Also show popup when cartCount increases
  useEffect(() => {
    if (cartCount > 0 && !isLoading) {
      console.log('CartPopup: Cart updated with items, showing popup');
      setShow(true);

      // Clear any existing timer
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }

      // Set new timer
      popupTimerRef.current = setTimeout(() => {
        setShow(false);
      }, 5000);
    }
  }, [cartCount, isLoading]);

  // Don't show anything during loading or if cart is empty
  if (isLoading || cartCount === 0) {
    return null;
  }
  if (!show) {
    return null;
  }
  return;
};
export default CartPopup;