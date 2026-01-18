'use client';

import { useCallback } from 'react';

/**
 * Sound effect hook - currently disabled
 * To enable: add shutter.mp3 to public/sounds/ and uncomment audio logic
 */
export function useSoundEffect() {
  const playShutter = useCallback(() => {
    // Sound disabled - no-op
  }, []);

  return { playShutter };
}
