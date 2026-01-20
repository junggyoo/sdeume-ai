import { createHmac, timingSafeEqual } from 'crypto';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  FalWebhookPayload,
  FalWebhookStatus,
  PersonRole,
} from '@/features/shooting/types';
import { SHOOT_ERROR_CODES } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

export interface FalClientConfig {
  apiKey: string;
  webhookSecret: string;
  webhookUrl: string;
}

interface StartTrainingParams {
  imagesZipUrl: string;
  role: PersonRole;
  projectId: string;
}

interface StartTrainingResult {
  requestId: string;
}

interface ParsedWebhookPayload {
  requestId: string;
  status: FalWebhookStatus;
  loraUrl?: string;
  errorMessage?: string;
  errorCode?: string;
}

// =============================================================================
// Constants
// =============================================================================

const FAL_API_BASE = 'https://queue.fal.run';
const FAL_FLUX_LORA_TRAINER = 'fal-ai/flux-lora-portrait-trainer';

// =============================================================================
// Start LoRA Training
// =============================================================================

export const startLoraTraining = async (
  config: FalClientConfig,
  params: StartTrainingParams
): Promise<HandlerResult<StartTrainingResult, string>> => {
  const triggerWord = params.role === 'groom' ? 'GROOM_SDME' : 'BRIDE_SDME';

  const requestBody = {
    images_data_url: params.imagesZipUrl,
    trigger_phrase: triggerWord,
    steps: 1500,
    create_masks: true,
    subject_crop: true,  
    multiresolution_training: true, 
    webhook_url: config.webhookUrl,
  };

  try {
    const response = await fetch(`${FAL_API_BASE}/${FAL_FLUX_LORA_TRAINER}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Fal.ai API error: ${response.status}`;
      return failure(
        response.status as ContentfulStatusCode,
        'FAL_TRAINING_START_ERROR',
        errorMessage
      );
    }

    const data = await response.json();

    return success({
      requestId: data.request_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failure(
      500,
      'FAL_TRAINING_START_ERROR',
      `Failed to start LoRA training: ${message}`
    );
  }
};

// =============================================================================
// Verify Webhook Signature
// =============================================================================

export const verifyFalWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

// =============================================================================
// Parse Webhook Payload
// =============================================================================

export const parseFalWebhookPayload = (
  payload: FalWebhookPayload
): HandlerResult<ParsedWebhookPayload, string> => {
  // Validate required fields
  if (!payload.request_id || !payload.status) {
    return failure(400, 'INVALID_PAYLOAD', 'Missing required fields: request_id or status');
  }

  const result: ParsedWebhookPayload = {
    requestId: payload.request_id,
    status: payload.status,
  };

  // Handle COMPLETED status
  if (payload.status === 'COMPLETED') {
    if (!payload.output?.diffusers_lora_file?.url) {
      return failure(
        400,
        'INVALID_PAYLOAD',
        'COMPLETED status missing output.diffusers_lora_file.url'
      );
    }
    result.loraUrl = payload.output.diffusers_lora_file.url;
  }

  // Handle FAILED status
  if (payload.status === 'FAILED') {
    result.errorMessage = payload.error?.message || 'Unknown training error';
    result.errorCode = payload.error?.code;
  }

  return success(result);
};

// =============================================================================
// Create Training ZIP URL
// =============================================================================

export const createTrainingZipUrl = (
  projectId: string,
  role: PersonRole
): string => {
  // This generates the expected URL path for the training images ZIP
  // The actual ZIP file should be created and uploaded before calling Fal.ai
  return `training-images/${projectId}/${role}/images.zip`;
};

// =============================================================================
// Get Training Status (optional - for polling if needed)
// =============================================================================

export const getTrainingStatus = async (
  config: FalClientConfig,
  requestId: string
): Promise<HandlerResult<{ status: FalWebhookStatus; loraUrl?: string }, string>> => {
  try {
    const response = await fetch(
      `${FAL_API_BASE}/${FAL_FLUX_LORA_TRAINER}/requests/${requestId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Key ${config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return failure(
        response.status as ContentfulStatusCode,
        'FAL_STATUS_ERROR',
        `Failed to get training status: ${response.status}`
      );
    }

    const data = await response.json();

    // fal.ai queue API response structure:
    // - Pending/In progress: {"status": "IN_QUEUE"} or {"status": "IN_PROGRESS"}
    // - Completed: returns result directly without status field: {"diffusers_lora_file": {"url": "..."}}
    // - Failed: {"status": "FAILED", "error": {...}}

    // If status field exists, normalize to uppercase
    if (data.status) {
      const normalizedStatus = (data.status as string).toUpperCase() as FalWebhookStatus;
      return success({
        status: normalizedStatus,
        loraUrl: undefined,
      });
    }

    // If no status field but diffusers_lora_file exists, job is completed
    if (data.diffusers_lora_file?.url) {
      return success({
        status: 'COMPLETED',
        loraUrl: data.diffusers_lora_file.url,
      });
    }

    // Fallback: unknown response structure
    return failure(500, 'FAL_STATUS_ERROR', 'Unknown fal.ai response structure');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failure(500, 'FAL_STATUS_ERROR', message);
  }
};
