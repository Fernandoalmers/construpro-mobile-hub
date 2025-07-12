import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollPosition(isLoading?: boolean) {
  const location = useLocation();

  // Save scroll position when leaving the page
  useEffect(() => {
    const saveScrollPosition = () => {
      const scrollPosition = window.pageYOffset;
      // Include query parameters in the key to handle different product filters
      const storageKey = `scroll-${location.pathname}${location.search}`;
      sessionStorage.setItem(storageKey, scrollPosition.toString());
    };

    // Save position on route change
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname, location.search]);

  // Restore scroll position when entering the page
  useEffect(() => {
    // Don't restore if still loading
    if (isLoading) return;

    const restoreScrollPosition = () => {
      const storageKey = `scroll-${location.pathname}${location.search}`;
      const savedPosition = sessionStorage.getItem(storageKey);
      
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        
        // Validate position is reasonable
        if (position >= 0 && position <= document.documentElement.scrollHeight) {
          // Temporarily disable smooth scroll for precise restoration
          const originalBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          
          setTimeout(() => {
            window.scrollTo({
              top: position,
              behavior: 'auto'
            });
            
            // Restore smooth scroll behavior after a brief delay
            setTimeout(() => {
              document.documentElement.style.scrollBehavior = originalBehavior;
            }, 50);
          }, 300); // Increased timeout to ensure content is fully loaded
        }
      }
    };

    restoreScrollPosition();
  }, [location.pathname, location.search, isLoading]);

  return null;
}