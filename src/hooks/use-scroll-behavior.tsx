
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

  // Debounced scroll handler with bottom detection
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Don't do anything if scroll difference is too small
    if (Math.abs(currentScrollY - lastScrollY) < SCROLL_THRESHOLD) {
      return;
    }
    
    const nearBottom = isNearBottom();
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY) {
      // Scrolling down
      setScrollDirection('down');
      // Only hide if we've scrolled enough from the top and not near bottom
      if (currentScrollY > HIDE_THRESHOLD && !nearBottom) {
        setHideFilters(true);
      }
    } else {
      // Scrolling up
      setScrollDirection('up');
      // Only show filters if user scrolled up significantly or not near bottom
      const scrollUpDistance = lastScrollY - currentScrollY;
      if (scrollUpDistance > SCROLL_THRESHOLD * 2 || !nearBottom) {
        setHideFilters(false);
      }
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY, isNearBottom]);

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
