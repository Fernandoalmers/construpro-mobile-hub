
import { useState, useEffect, useCallback } from 'react';

export function useScrollBehavior() {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  
  // Threshold for how much scroll is needed to trigger hiding
  const SCROLL_THRESHOLD = 10;
  const HIDE_THRESHOLD = 80; // Only hide after scrolling this much from top

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
      timeoutId = setTimeout(handleScroll, 10); // 10ms throttle
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return { hideHeader, scrollDirection, lastScrollY };
}
