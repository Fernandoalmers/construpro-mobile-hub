import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollPosition() {
  const location = useLocation();

  // Save scroll position when leaving the page
  useEffect(() => {
    const saveScrollPosition = () => {
      const scrollPosition = window.pageYOffset;
      sessionStorage.setItem(`scroll-${location.pathname}`, scrollPosition.toString());
    };

    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save position on route change
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname]);

  // Restore scroll position when entering the page
  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem(`scroll-${location.pathname}`);
      if (savedPosition) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    restoreScrollPosition();
  }, [location.pathname]);

  return null;
}