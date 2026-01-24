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
// Environment Validation
// =============================================================================

function validateProductionEnv(): { token: string; appUrl: string } {
  const token = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    throw new Error('QSTASH_TOKEN environment variable is required in production');
  }

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }

  return { token, appUrl };
}

// =============================================================================
// QStash Client (lazy initialization)
// =============================================================================

let qstashClient: Client | null = null;

function getQStashClient(): Client {
  if (!qstashClient) {
    const { token } = validateProductionEnv();
    qstashClient = new Client({ token });
  }
  return qstashClient;
}

// =============================================================================
// enqueueTrainingJob
// =============================================================================

/**
 * Enqueue a training job to be processed asynchronously.
 *
 * In development/test environments, this returns immediately with a dev-mode
 * messageId without actually queuing to QStash.
 *
 * In production, this queues the job to QStash which will POST to
 * /api/jobs/prepare-training with automatic retries.
 */
export async function enqueueTrainingJob(
  payload: TrainingJobPayload
): Promise<EnqueueResult> {
  // Skip QStash in development and test environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('[QStash] Skipping QStash in non-production environment');
    return { messageId: 'dev-mode' };
  }

  const { appUrl } = validateProductionEnv();
  const qstash = getQStashClient();

  const result = await qstash.publishJSON({
    url: `${appUrl}/api/jobs/prepare-training`,
    body: payload,
    retries: 3,
  });

  return { messageId: result.messageId };
}
