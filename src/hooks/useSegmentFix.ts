
import { useEffect, useState } from 'react';
import { fixProductSegments } from '@/utils/fixProductSegment';

export const useSegmentFix = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [hasFixed, setHasFixed] = useState(false);

  useEffect(() => {
    const runSegmentFix = async () => {
      if (hasFixed || isFixing) return;
      
      setIsFixing(true);
      try {
        await fixProductSegments();
        setHasFixed(true);
        console.log('[useSegmentFix] Segment correction completed successfully');
      } catch (error) {
        console.error('[useSegmentFix] Failed to fix segments:', error);
      } finally {
        setIsFixing(false);
      }
    };

    // Run the fix after a short delay to ensure components are mounted
    const timeout = setTimeout(runSegmentFix, 2000);
    
    return () => clearTimeout(timeout);
  }, [hasFixed, isFixing]);

  return { isFixing, hasFixed };
};
