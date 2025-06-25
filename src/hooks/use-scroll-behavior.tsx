
import { useState, useEffect, useCallback } from 'react';

export function useScrollBehavior() {
  const [hideFilters, setHideFilters] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  
  // Increased thresholds for more stable behavior
  const SCROLL_THRESHOLD = 20;
  const HIDE_THRESHOLD = 120;
  const BOTTOM_THRESHOLD = 100; // Distance from bottom to consider "at bottom"

  // Helper function to check if user is near bottom of page
  const isNearBottom = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    return scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD;
  }, []);

  // Helper function to check if user is near top of page
  const isNearTop = useCallback(() => {
    return window.scrollY < HIDE_THRESHOLD;
  }, []);

  // Debounced scroll handler with corrected logic
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Don't do anything if scroll difference is too small
    if (Math.abs(currentScrollY - lastScrollY) < SCROLL_THRESHOLD) {
      return;
    }
    
    const nearBottom = isNearBottom();
    const nearTop = isNearTop();
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY) {
      // Scrolling down - SHOW filters
      setScrollDirection('down');
      setHideFilters(false);
    } else {
      // Scrolling up - HIDE filters
      setScrollDirection('up');
      // Only hide if we've scrolled enough from the top and not near bottom
      if (!nearTop && !nearBottom) {
        setHideFilters(true);
      }
    }
    
    // Special case: if near top, always show filters
    if (nearTop) {
      setHideFilters(false);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY, isNearBottom, isNearTop]);

  // Handle scroll events with passive listener for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return { hideFilters, scrollDirection, lastScrollY };
}
