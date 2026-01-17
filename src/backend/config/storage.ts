/**
 * Supabase Storage Configuration
 *
 * Centralized storage bucket configuration to avoid hardcoding.
 */

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'sdeume-storage';

export const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour in seconds
