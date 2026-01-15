'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

const SOUND_PATH = '/sounds/shutter.mp3';
const VOLUME = 0.3;

export function useSoundEffect() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Preload audio on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      audioRef.current = new Audio(SOUND_PATH);
      audioRef.current.volume = VOLUME;
      audioRef.current.preload = 'auto';
    } catch (e) {
      // Audio not supported in this environment
      console.log('[Sound] Audio API not available');
    }

    return () => {
      audioRef.current = null;
    };
  }, []);

  const playShutter = useCallback(() => {
    // Respect reduced motion preference
    if (prefersReducedMotion) return;

    if (!audioRef.current) return;

    // Reset to start if already playing
    audioRef.current.currentTime = 0;

    audioRef.current.play().catch(() => {
      // Silently fail if autoplay blocked by browser policy
      console.log('[Sound] Autoplay blocked by browser');
    });
  }, [prefersReducedMotion]);

  return { playShutter };
}
