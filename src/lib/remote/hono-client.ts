'use client';

import { hc } from 'hono/client';
import type { AppType } from '@/backend/hono/app';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

// =============================================================================
// Custom Fetch with Auth Token Injection
// =============================================================================

const createAuthFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers(init?.headers);
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    return fetch(input, { ...init, headers });
  };
};

// =============================================================================
// Hono RPC Client
// =============================================================================

let clientInstance: ReturnType<typeof hc<AppType>> | null = null;

/**
 * Get the Hono RPC client instance.
 * Uses singleton pattern for client reuse.
 * Auth token is automatically injected via custom fetch.
 */
export const getHonoClient = () => {
  if (!clientInstance) {
    clientInstance = hc<AppType>('', { fetch: createAuthFetch() });
  }
  return clientInstance;
};

/**
 * Create a new Hono RPC client instance.
 * Use this when you need a fresh client (e.g., for testing).
 */
export const createHonoClient = () => {
  return hc<AppType>('', { fetch: createAuthFetch() });
};
