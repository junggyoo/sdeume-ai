import { handlePrepareTraining } from './handler';

/**
 * POST /api/jobs/prepare-training
 *
 * QStash background job handler for preparing training data.
 * This endpoint is called by QStash with automatic retries.
 *
 * Security: In production, requests are verified using QStash signature verification.
 * In development/CI, signature verification is skipped.
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
 * Conditionally wrap handler with QStash signature verification.
 * Only in production with proper signing keys configured.
 */
async function createHandler(): Promise<typeof handler> {
  // Skip signature verification in non-production or when keys are missing
  if (
    process.env.NODE_ENV !== 'production' ||
    !process.env.QSTASH_CURRENT_SIGNING_KEY
  ) {
    return handler;
  }

  // Dynamic import to avoid build-time errors when keys are missing
  const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs');
  return verifySignatureAppRouter(handler);
}

// Export POST handler - uses signature verification only in production with keys
export const POST = async (req: Request): Promise<Response> => {
  const wrappedHandler = await createHandler();
  return wrappedHandler(req);
};

// Configure for Vercel
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes
