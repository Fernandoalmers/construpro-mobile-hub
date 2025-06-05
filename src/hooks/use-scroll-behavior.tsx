
import { useState, useEffect, useCallback } from 'react';

export function useScrollBehavior() {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  
  // Increased thresholds for more stable behavior
  const SCROLL_THRESHOLD = 20;
  const HIDE_THRESHOLD = 120; // Increased from 80 for more deliberate hiding

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Don't do anything if scroll difference is too small
    if (Math.abs(currentScrollY - lastScrollY) < SCROLL_THRESHOLD) {
      return;
    }
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY) {
      // Scrolling down
      setScrollDirection('down');
      // Only hide if we've scrolled enough from the top
      if (currentScrollY > HIDE_THRESHOLD) {
        setHideHeader(true);
      }
    } else {
      // Scrolling up
      setScrollDirection('up');
      setHideHeader(false);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Handle scroll events with passive listener for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16); // Increased from 10ms for smoother performance
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return { hideHeader, scrollDirection, lastScrollY };
}
