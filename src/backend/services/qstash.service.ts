import { Client } from '@upstash/qstash';

// =============================================================================
// Types
// =============================================================================

export interface TrainingJobPayload {
  generationId: string;
  projectId: string;
  userId: string;
}

export interface EnqueueResult {
  messageId: string;
}

// =============================================================================
// Local Mode Configuration
// =============================================================================

/**
 * QStash Local Mode - for development testing with qstash-cli
 *
 * Start local server: npx @upstash/qstash-cli@latest dev
 * Server runs at: http://localhost:8080
 *
 * @see https://upstash.com/docs/qstash/howto/local-development
 */
const LOCAL_QSTASH_CONFIG = {
  url: 'http://localhost:8080',
  token: 'eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0=',
  signingKey: 'sig_7kYjw48mhY7kAjqNGcy6cr29RJ6r',
  nextSigningKey: 'sig_5ZB6DVzB1wjE8S6rZ7eenA8Pdnhs',
};

// =============================================================================
// Environment Helpers
// =============================================================================

/**
 * Check if QStash is running in local mode.
 * Local mode is enabled when QSTASH_URL points to localhost.
 */
export function isLocalMode(): boolean {
  const qstashUrl = process.env.QSTASH_URL;
  return Boolean(qstashUrl && qstashUrl.includes('localhost'));
}

/**
 * Get QStash configuration based on environment.
 * Supports both production (Upstash cloud) and local mode (qstash-cli dev).
 */
function getQStashConfig(): { token: string; baseUrl?: string } {
  // Local mode: use local server
  if (isLocalMode()) {
    return {
      token: process.env.QSTASH_TOKEN || LOCAL_QSTASH_CONFIG.token,
      baseUrl: process.env.QSTASH_URL || LOCAL_QSTASH_CONFIG.url,
    };
  }

  // Production mode: require real credentials
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error('QSTASH_TOKEN environment variable is required');
  }

  return { token };
}

function getAppUrl(): string {
  // Local mode: always use localhost (QStash CLI runs on the same machine)
  if (isLocalMode()) {
    return 'http://localhost:3000';
  }

  // Production mode: require real URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }

  return appUrl;
}

// =============================================================================
// QStash Client (lazy initialization)
// =============================================================================

let qstashClient: Client | null = null;

function getQStashClient(): Client {
  if (!qstashClient) {
    const config = getQStashConfig();
    qstashClient = new Client(config);
  }
  return qstashClient;
}

// Reset client (for testing)
export function resetQStashClient(): void {
  qstashClient = null;
}

// =============================================================================
// enqueueTrainingJob
// =============================================================================

/**
 * Enqueue a training job to be processed asynchronously.
 *
 * Supports three modes:
 * 1. Production: Uses Upstash QStash cloud
 * 2. Local Mode: Uses qstash-cli local server (npx @upstash/qstash-cli@latest dev)
 * 3. Skip Mode: In test/CI without QStash config, returns dev-mode messageId
 */
/**
 * Enqueue a prompt test generation job to be processed asynchronously.
 */
export async function enqueuePromptTestJob(
  testId: string
): Promise<EnqueueResult> {
  const hasQStashConfig = Boolean(process.env.QSTASH_TOKEN || process.env.QSTASH_URL);

  if (!hasQStashConfig && process.env.NODE_ENV !== 'production') {
    console.log('[QStash] Skipping QStash in non-production environment');
    return { messageId: 'dev-mode' };
  }

  const appUrl = getAppUrl();
  const qstash = getQStashClient();

  if (isLocalMode()) {
    console.log('[QStash] Using local mode for prompt test job');
  }

  const result = await qstash.publishJSON({
    url: `${appUrl}/api/jobs/prompt-test-generate`,
    body: { testId },
    retries: 3,
  });

  return { messageId: result.messageId };
}

/**
 * Enqueue a training job to be processed asynchronously.
 *
 * Supports three modes:
 * 1. Production: Uses Upstash QStash cloud
 * 2. Local Mode: Uses qstash-cli local server (npx @upstash/qstash-cli@latest dev)
 * 3. Skip Mode: In test/CI without QStash config, returns dev-mode messageId
 */
export async function enqueueTrainingJob(
  payload: TrainingJobPayload
): Promise<EnqueueResult> {
  // Skip QStash if not configured and not in production
  const hasQStashConfig = Boolean(process.env.QSTASH_TOKEN || process.env.QSTASH_URL);

  if (!hasQStashConfig && process.env.NODE_ENV !== 'production') {
    console.log('[QStash] Skipping QStash in non-production environment');
    return { messageId: 'dev-mode' };
  }

  const appUrl = getAppUrl();
  const qstash = getQStashClient();

  if (isLocalMode()) {
    console.log('[QStash] Using local mode (qstash-cli dev server)');
  }

  const result = await qstash.publishJSON({
    url: `${appUrl}/api/jobs/prepare-training`,
    body: payload,
    retries: 3,
  });

  return { messageId: result.messageId };
}
