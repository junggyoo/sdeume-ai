import { createClient } from '@supabase/supabase-js';
import type { PromptTestImage } from '@/features/admin-prompt-lab/types';
import type { AdminPromptTestRow } from '@/features/admin-prompt-lab/types';
import {
  buildModalRequest,
  updatePromptTestProgress,
} from '@/backend/services/admin-prompt-test.service';
import { getAppConfig } from '@/backend/config';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';
import type { PromptOverrides } from '@/features/admin-prompt-lab/types';

/**
 * POST /api/jobs/prompt-test-generate
 *
 * QStash background job handler for generating prompt test images.
 * Receives { testId } payload, processes batches, updates DB incrementally.
 */
async function handler(req: Request): Promise<Response> {
  try {
    const payload = await req.json();
    const { testId } = payload;

    if (!testId) {
      return Response.json(
        { success: false, error: 'Missing testId' },
        { status: 400 }
      );
    }

    const config = getAppConfig();
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );

    // Fetch test record
    const { data: testRow, error: fetchError } = await supabase
      .from('admin_prompt_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchError || !testRow) {
      console.error('[PromptTestJob] Test not found:', testId);
      return Response.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    const test = testRow as AdminPromptTestRow;

    // Idempotency: only process queued tests
    if (test.status !== 'queued') {
      console.log(`[PromptTestJob] Skipping test ${testId} (status: ${test.status})`);
      return Response.json({ success: true, message: 'Already processed' });
    }

    // Mark as generating
    await updatePromptTestProgress(supabase, testId, { status: 'generating' });

    const endpointUrl = config.modal.endpointUrl;
    if (!endpointUrl) {
      await updatePromptTestProgress(supabase, testId, {
        status: 'failed',
        errorMessage: 'Modal endpoint not configured',
      });
      return Response.json(
        { success: false, error: 'Modal endpoint not configured' },
        { status: 500 }
      );
    }

    // Build Modal request
    const modalRequest = buildModalRequest({
      themeSlug: test.theme_slug as ThemeSlug,
      shotType: test.shot_type as ShotType,
      groomLoraUrl: test.groom_lora_url!,
      brideLoraUrl: test.bride_lora_url!,
      promptOverrides: test.prompt_overrides as PromptOverrides,
      nodeOverrides: test.node_overrides ?? undefined,
      seed: test.seed ?? undefined,
      extraStyleTags: test.extra_style_tags ?? undefined,
    });

    const BATCH_SIZE = 4;
    const totalCount = test.total_count;
    const startTime = Date.now();

    // Build batches
    const batches: number[] = [];
    let remaining = totalCount;
    while (remaining > 0) {
      batches.push(Math.min(remaining, BATCH_SIZE));
      remaining -= BATCH_SIZE;
    }

    type ModalImage = { base64: string; content_type: string; width: number; height: number };

    const allImages: PromptTestImage[] = [];

    // Process batches (parallel per batch group of 4 concurrent)
    for (let i = 0; i < batches.length; i += BATCH_SIZE) {
      const batchGroup = batches.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batchGroup.map(async (batchCount) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000);

          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...modalRequest,
              count: batchCount,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Modal API error');
          }

          const data = await response.json();
          return data.images as ModalImage[];
        })
      );

      // Collect successful images from this batch group
      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const img of result.value) {
            allImages.push({
              base64: img.base64,
              contentType: img.content_type,
              width: img.width,
              height: img.height,
            });
          }
        }
      }

      // Update progress incrementally
      await updatePromptTestProgress(supabase, testId, {
        progress: allImages.length,
        images: allImages,
      });
    }

    const generationTimeMs = Date.now() - startTime;

    if (allImages.length === 0) {
      await updatePromptTestProgress(supabase, testId, {
        status: 'failed',
        errorMessage: 'All batches failed',
        generationTimeMs,
      });
      return Response.json(
        { success: false, error: 'All batches failed' },
        { status: 500 }
      );
    }

    // Mark as completed
    await updatePromptTestProgress(supabase, testId, {
      status: 'completed',
      progress: allImages.length,
      images: allImages,
      generationTimeMs,
    });

    return Response.json({
      success: true,
      imageCount: allImages.length,
      generationTimeMs,
    });
  } catch (error) {
    console.error('[PromptTestJob] Error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Conditionally wrap handler with QStash signature verification.
 */
function shouldVerifySignature(): boolean {
  return Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY);
}

async function createHandler(): Promise<typeof handler> {
  if (!shouldVerifySignature()) {
    console.log('[PromptTestJob] Signature verification disabled');
    return handler;
  }

  const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs');
  return verifySignatureAppRouter(handler);
}

export const POST = async (req: Request): Promise<Response> => {
  const wrappedHandler = await createHandler();
  return wrappedHandler(req);
};

export const runtime = 'nodejs';
export const maxDuration = 300;
