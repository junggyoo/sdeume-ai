import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { handlePrepareTraining } from './handler';

/**
 * POST /api/jobs/prepare-training
 *
 * QStash background job handler for preparing training data.
 * This endpoint is called by QStash with automatic retries.
 *
 * Security: Requests are verified using QStash signature verification.
 * The verifySignatureAppRouter middleware validates that requests
 * come from QStash using the signing keys from environment variables.
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

// Wrap handler with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

// Configure for Vercel
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes
