
import { useCallback, useEffect, useRef, useState } from 'react';
import { type CarouselApi } from '@/components/ui/carousel';

interface UseCarouselAutoplayOptions {
  delay?: number;
  stopOnInteraction?: boolean;
}

export const useCarouselAutoplay = (
  api: CarouselApi | undefined,
  options: UseCarouselAutoplayOptions = {}
) => {
  const { delay = 3000, stopOnInteraction = true } = options;
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const isInteractingRef = useRef(false);

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    if (!api || !isPlaying || isPaused || isInteractingRef.current) return;
    
    clearAutoplay();
    intervalRef.current = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, delay);
  }, [api, isPlaying, isPaused, delay, clearAutoplay]);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearAutoplay();
  }, [clearAutoplay]);

  const resume = useCallback(() => {
    setIsPaused(false);
    if (isPlaying) {
      startAutoplay();
    }
  }, [isPlaying, startAutoplay]);

  const play = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    startAutoplay();
  }, [startAutoplay]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    clearAutoplay();
  }, [clearAutoplay]);

  const handleInteractionStart = useCallback(() => {
    if (!stopOnInteraction) return;
    isInteractingRef.current = true;
    pause();
  }, [stopOnInteraction, pause]);

  const handleInteractionEnd = useCallback(() => {
    if (!stopOnInteraction) return;
    isInteractingRef.current = false;
    setTimeout(() => {
      if (!isInteractingRef.current) {
        resume();
      }
    }, 500); // Small delay to prevent immediate restart
  }, [stopOnInteraction, resume]);

  // Start autoplay when API is ready
  useEffect(() => {
    if (api && isPlaying && !isPaused) {
      startAutoplay();
    }
    return clearAutoplay;
  }, [api, isPlaying, isPaused, startAutoplay, clearAutoplay]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else if (isPlaying) {
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, pause, resume]);

  // Cleanup on unmount
  useEffect(() => {
    return clearAutoplay;
  }, [clearAutoplay]);

  return {
    isPlaying,
    isPaused,
    play,
    stop,
    pause,
    resume,
    handleInteractionStart,
    handleInteractionEnd
  };
};
