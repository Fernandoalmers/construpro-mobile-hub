
import { useState, useEffect } from 'react';

export function useScrollBehavior() {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  
  // Threshold for how much scroll is needed to trigger hiding
  const SCROLL_THRESHOLD = 50;

  // Handle scroll events for showing/hiding header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY + 10) {
        // Scrolling down
        setScrollDirection('down');
        if (currentScrollY > SCROLL_THRESHOLD) {
          setHideHeader(true);
        }
      } else if (currentScrollY < lastScrollY - 10) {
        // Scrolling up
        setScrollDirection('up');
        setHideHeader(false);
      }
      
      // Update last scroll position
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return { hideHeader, scrollDirection, lastScrollY };
}
