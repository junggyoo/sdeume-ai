import { handlePrepareTraining } from './handler';

/**
 * POST /api/jobs/prepare-training
 *
 * QStash background job handler for preparing training data.
 * This endpoint is called by QStash with automatic retries.
 *
 * Security modes:
 * 1. Production: Signature verification with Upstash keys
 * 2. Local Mode: Signature verification with qstash-cli dev keys
 * 3. CI/Test: Signature verification skipped (no keys configured)
 *
 * @see https://upstash.com/docs/qstash/howto/local-development
 */
async function handler(req: Request): Promise<Response> {
  try {
    const payload = await req.json();
    const { generationId, projectId, userId } = payload;

    if (!generationId || !projectId || !userId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await handlePrepareTraining({
      generationId,
      projectId,
      userId,
    });

    if (result.success) {
      return Response.json(result);
    }

    // Return 500 to trigger QStash retry for transient failures
    return Response.json(result, { status: 500 });
  } catch (error) {
    console.error('[Job Route] Error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if QStash signature verification should be enabled.
 * Enabled when QSTASH_CURRENT_SIGNING_KEY is set (production or local mode).
 */
function shouldVerifySignature(): boolean {
  return Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY);
}

/**
 * Conditionally wrap handler with QStash signature verification.
 * Enabled in both production and local mode when signing keys are configured.
 */
async function createHandler(): Promise<typeof handler> {
  if (!shouldVerifySignature()) {
    console.log('[Job Route] Signature verification disabled (no signing key)');
    return handler;
  }

  // Dynamic import to avoid build-time errors when keys are missing
  const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs');
  return verifySignatureAppRouter(handler);
}

// Export POST handler - uses signature verification when keys are configured
export const POST = async (req: Request): Promise<Response> => {
  const wrappedHandler = await createHandler();
  return wrappedHandler(req);
};

// Configure for Vercel
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes
