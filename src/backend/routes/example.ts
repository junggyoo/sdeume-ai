import type { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  failure,
  success,
  respond,
  type HandlerResult,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';

// =============================================================================
// Error Codes
// =============================================================================

const exampleErrorCodes = {
  notFound: 'EXAMPLE_NOT_FOUND',
  fetchError: 'EXAMPLE_FETCH_ERROR',
  validationError: 'EXAMPLE_VALIDATION_ERROR',
} as const;

type ExampleServiceError =
  (typeof exampleErrorCodes)[keyof typeof exampleErrorCodes];

// =============================================================================
// Schemas
// =============================================================================

const ExampleParamsSchema = z.object({
  id: z.string().uuid({ message: 'Example id must be a valid UUID.' }),
});

const ExampleResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().url(),
  bio: z.string().nullable(),
  updatedAt: z.string(),
});

type ExampleResponse = z.infer<typeof ExampleResponseSchema>;

const ExampleTableRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  updated_at: z.string(),
});

type ExampleRow = z.infer<typeof ExampleTableRowSchema>;

// =============================================================================
// Constants
// =============================================================================

const EXAMPLE_TABLE = 'example';

// =============================================================================
// Helpers
// =============================================================================

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

// =============================================================================
// Service Functions
// =============================================================================

const getExampleById = async (
  client: SupabaseClient,
  id: string
): Promise<HandlerResult<ExampleResponse, ExampleServiceError, unknown>> => {
  const { data, error } = await client
    .from(EXAMPLE_TABLE)
    .select('id, full_name, avatar_url, bio, updated_at')
    .eq('id', id)
    .maybeSingle<ExampleRow>();

  if (error) {
    return failure(500, exampleErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, exampleErrorCodes.notFound, 'Example not found');
  }

  const rowParse = ExampleTableRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      exampleErrorCodes.validationError,
      'Example row failed validation.',
      rowParse.error.format()
    );
  }

  const mapped = {
    id: rowParse.data.id,
    fullName: rowParse.data.full_name ?? 'Anonymous User',
    avatarUrl: rowParse.data.avatar_url ?? fallbackAvatar(rowParse.data.id),
    bio: rowParse.data.bio,
    updatedAt: rowParse.data.updated_at,
  } satisfies ExampleResponse;

  const parsed = ExampleResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      exampleErrorCodes.validationError,
      'Example payload failed validation.',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

// =============================================================================
// Route Registration
// =============================================================================

export const registerExampleRoutes = (app: Hono<AppEnv>) => {
  app.get('/example/:id', async (c) => {
    const parsedParams = ExampleParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_EXAMPLE_PARAMS',
          'The provided example id is invalid.',
          parsedParams.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getExampleById(supabase, parsedParams.data.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ExampleServiceError, unknown>;

      if (errorResult.error.code === exampleErrorCodes.fetchError) {
        logger.error('Failed to fetch example', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
