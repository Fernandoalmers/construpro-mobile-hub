
import { useState, useEffect } from 'react';

export function useScrollBehavior() {
  const [hideHeader, setHideHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  // Handle scroll events for showing/hiding header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY + 10) {
        setScrollDirection('down');
        setHideHeader(true);
      } else if (currentScrollY < lastScrollY - 10) {
        setScrollDirection('up');
        setHideHeader(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return { hideHeader, scrollDirection };
}
