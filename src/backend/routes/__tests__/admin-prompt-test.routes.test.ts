// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { adminPromptTestRoutes } from '../admin-prompt-test';

// Mock QStash service
vi.mock('@/backend/services/qstash.service', () => ({
  enqueuePromptTestJob: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
}));

import { enqueuePromptTestJob } from '@/backend/services/qstash.service';

// =============================================================================
// Mocks
// =============================================================================

const mockSingle = vi.fn();

const createChainedMock = () => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        }),
      }),
      single: mockSingle,
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }),
    }),
    single: mockSingle,
    order: vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }),
  }),
  insert: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  }),
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

const mockSupabase = {
  from: vi.fn(() => createChainedMock()),
  auth: {
    getUser: vi.fn(),
  },
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockConfig = {
  modal: {
    endpointUrl: 'https://test.modal.run',
  },
};

// Create test app
const createTestApp = () => {
  const app = new Hono<AppEnv>();

  // Add mock middleware
  app.use('*', async (c, next) => {
    c.set('supabase', mockSupabase as Parameters<typeof c.set>[1]);
    c.set('logger', mockLogger as Parameters<typeof c.set>[1]);
    c.set('config', mockConfig as Parameters<typeof c.set>[1]);
    await next();
  });

  // Register routes
  app.route('/admin/prompt-test', adminPromptTestRoutes);

  return app;
};

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_TEST_ID = '550e8400-e29b-41d4-a716-446655440002';
const MOCK_GROOM_LORA_URL = 'https://storage.fal.ai/lora/groom-model.safetensors';
const MOCK_BRIDE_LORA_URL = 'https://storage.fal.ai/lora/bride-model.safetensors';

// =============================================================================
// Tests: POST /admin/prompt-test/generate (Async - returns immediately)
// =============================================================================

describe('POST /admin/prompt-test/generate', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('should return 400 with invalid themeSlug', async () => {
    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'invalid_theme',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 without required LoRA URLs', async () => {
    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should return testId immediately with status=queued (async pattern)', async () => {
    // Mock database insert - returns the queued record
    mockSingle.mockResolvedValueOnce({
      data: {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: null,
        node_overrides: null,
        seed: 12345,
        extra_style_tags: null,
        groom_lora_url: MOCK_GROOM_LORA_URL,
        bride_lora_url: MOCK_BRIDE_LORA_URL,
        images: null,
        generation_time_ms: null,
        assembled_prompts: {
          node6MainPositive: 'Test prompt...',
          node7MainNegative: 'illustration...',
          node21GroomFace: 'GROOM_SDME, ...',
          node26GroomFaceNegative: 'woman...',
          node23BrideFace: 'BRIDE_SDME, ...',
          node27BrideFaceNegative: 'man...',
          node38HandPositive: 'detailed hands...',
          node39HandNegative: '',
        },
        status: 'queued',
        progress: 0,
        total_count: 1,
        error_message: null,
        quality_issues: null,
        notes: null,
        is_favorite: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
        seed: 12345,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.testId).toBe(TEST_TEST_ID);
    expect(body.data.status).toBe('queued');
    // Should NOT have images yet (async - generation happens in background)
    expect(body.data.images).toBeUndefined();
    // Should have enqueued a QStash job
    expect(enqueuePromptTestJob).toHaveBeenCalledWith(TEST_TEST_ID);
  });

  it('should accept count up to 50 for async pattern', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: null,
        node_overrides: null,
        seed: 12345,
        extra_style_tags: null,
        groom_lora_url: MOCK_GROOM_LORA_URL,
        bride_lora_url: MOCK_BRIDE_LORA_URL,
        images: null,
        generation_time_ms: null,
        assembled_prompts: {
          node6MainPositive: 'Test',
          node7MainNegative: 'Test',
          node21GroomFace: 'Test',
          node26GroomFaceNegative: 'Test',
          node23BrideFace: 'Test',
          node27BrideFaceNegative: 'Test',
          node38HandPositive: 'Test',
          node39HandNegative: 'Test',
        },
        status: 'queued',
        progress: 0,
        total_count: 50,
        error_message: null,
        quality_issues: null,
        notes: null,
        is_favorite: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
        count: 50,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should return 400 when count exceeds max (51)', async () => {
    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
        count: 51,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should return assembledPrompts in response', async () => {
    const assembledPrompts = {
      node6MainPositive: 'Custom main prompt',
      node7MainNegative: 'illustration...',
      node21GroomFace: 'GROOM_SDME, face prompt',
      node26GroomFaceNegative: 'woman...',
      node23BrideFace: 'BRIDE_SDME, face prompt',
      node27BrideFaceNegative: 'man...',
      node38HandPositive: 'detailed hands...',
      node39HandNegative: '',
    };

    mockSingle.mockResolvedValueOnce({
      data: {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: null,
        node_overrides: null,
        seed: 12345,
        extra_style_tags: null,
        groom_lora_url: MOCK_GROOM_LORA_URL,
        bride_lora_url: MOCK_BRIDE_LORA_URL,
        images: null,
        generation_time_ms: null,
        assembled_prompts: assembledPrompts,
        status: 'queued',
        progress: 0,
        total_count: 1,
        error_message: null,
        quality_issues: null,
        notes: null,
        is_favorite: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.assembledPrompts).toBeDefined();
    // Verify assembled prompts contain expected keys (values come from real YAML theme)
    expect(body.data.assembledPrompts.node6MainPositive).toBeDefined();
    expect(body.data.assembledPrompts.node7MainNegative).toBeDefined();
    expect(body.data.assembledPrompts.node21GroomFace).toBeDefined();
    expect(body.data.assembledPrompts.node23BrideFace).toBeDefined();
  });

  it('should handle DB insert error gracefully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'UNKNOWN', message: 'Database error' },
    });

    const res = await app.request('/admin/prompt-test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        themeSlug: 'white_studio',
        shotType: 'full_body',
        groomLoraUrl: MOCK_GROOM_LORA_URL,
        brideLoraUrl: MOCK_BRIDE_LORA_URL,
      }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

// =============================================================================
// Tests: GET /admin/prompt-test/status/:testId (Polling endpoint)
// =============================================================================

describe('GET /admin/prompt-test/status/:testId', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
    });

    expect(res.status).toBe(401);
  });

  it('should return queued status with 0 progress', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: {
          id: TEST_TEST_ID,
          user_id: TEST_USER_ID,
          theme_slug: 'white_studio',
          shot_type: 'full_body',
          prompt_overrides: null,
          node_overrides: null,
          seed: 12345,
          extra_style_tags: null,
          groom_lora_url: MOCK_GROOM_LORA_URL,
          bride_lora_url: MOCK_BRIDE_LORA_URL,
          images: null,
          generation_time_ms: null,
          assembled_prompts: {},
          status: 'queued',
          progress: 0,
          total_count: 12,
          error_message: null,
          quality_issues: null,
          notes: null,
          is_favorite: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('queued');
    expect(body.data.progress).toBe(0);
    expect(body.data.totalCount).toBe(12);
  });

  it('should return generating status with partial progress and images', async () => {
    const partialImages = [
      { base64: 'img1', contentType: 'image/png', width: 896, height: 1152 },
      { base64: 'img2', contentType: 'image/png', width: 896, height: 1152 },
    ];

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: {
          id: TEST_TEST_ID,
          user_id: TEST_USER_ID,
          theme_slug: 'white_studio',
          shot_type: 'full_body',
          prompt_overrides: null,
          node_overrides: null,
          seed: 12345,
          extra_style_tags: null,
          groom_lora_url: MOCK_GROOM_LORA_URL,
          bride_lora_url: MOCK_BRIDE_LORA_URL,
          images: partialImages,
          generation_time_ms: null,
          assembled_prompts: {},
          status: 'generating',
          progress: 2,
          total_count: 12,
          error_message: null,
          quality_issues: null,
          notes: null,
          is_favorite: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('generating');
    expect(body.data.progress).toBe(2);
    expect(body.data.totalCount).toBe(12);
    expect(body.data.images).toHaveLength(2);
  });

  it('should return completed status with all images', async () => {
    const allImages = Array.from({ length: 12 }, (_, i) => ({
      base64: `img${i}`,
      contentType: 'image/png',
      width: 896,
      height: 1152,
    }));

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: {
          id: TEST_TEST_ID,
          user_id: TEST_USER_ID,
          theme_slug: 'white_studio',
          shot_type: 'full_body',
          prompt_overrides: null,
          node_overrides: null,
          seed: 12345,
          extra_style_tags: null,
          groom_lora_url: MOCK_GROOM_LORA_URL,
          bride_lora_url: MOCK_BRIDE_LORA_URL,
          images: allImages,
          generation_time_ms: 45000,
          assembled_prompts: {},
          status: 'completed',
          progress: 12,
          total_count: 12,
          error_message: null,
          quality_issues: null,
          notes: null,
          is_favorite: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('completed');
    expect(body.data.progress).toBe(12);
    expect(body.data.totalCount).toBe(12);
    expect(body.data.images).toHaveLength(12);
    expect(body.data.generationTimeMs).toBe(45000);
  });

  it('should return failed status with error message', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: {
          id: TEST_TEST_ID,
          user_id: TEST_USER_ID,
          theme_slug: 'white_studio',
          shot_type: 'full_body',
          prompt_overrides: null,
          node_overrides: null,
          seed: 12345,
          extra_style_tags: null,
          groom_lora_url: MOCK_GROOM_LORA_URL,
          bride_lora_url: MOCK_BRIDE_LORA_URL,
          images: null,
          generation_time_ms: null,
          assembled_prompts: {},
          status: 'failed',
          progress: 0,
          total_count: 12,
          error_message: 'All batches failed',
          quality_issues: null,
          notes: null,
          is_favorite: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('failed');
    expect(body.data.errorMessage).toBe('All batches failed');
  });

  it('should return 404 when test not found', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/status/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Tests: GET /admin/prompt-test/history
// =============================================================================

describe('GET /admin/prompt-test/history', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const res = await app.request('/admin/prompt-test/history', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('should return empty list when no tests exist', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.select = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });
      return chainedMock;
    });

    const res = await app.request('/admin/prompt-test/history', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.tests).toEqual([]);
    expect(body.data.total).toBe(0);
    expect(body.data.hasMore).toBe(false);
  });

  it('should return paginated test history', async () => {
    const mockTests = [
      {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: null,
        node_overrides: null,
        seed: 12345,
        extra_style_tags: null,
        groom_lora_url: MOCK_GROOM_LORA_URL,
        bride_lora_url: MOCK_BRIDE_LORA_URL,
        images: [],
        generation_time_ms: 42000,
        assembled_prompts: {},
        status: 'completed',
        progress: 1,
        total_count: 1,
        error_message: null,
        quality_issues: null,
        notes: null,
        is_favorite: false,
        created_at: new Date().toISOString(),
      },
    ];

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.select = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockTests,
            error: null,
            count: 1,
          }),
        }),
      });
      return chainedMock;
    });

    const res = await app.request('/admin/prompt-test/history?limit=10&offset=0', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.tests).toHaveLength(1);
    expect(body.data.total).toBe(1);
    expect(body.data.hasMore).toBe(false);
  });

  it('should filter by themeSlug', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });
      return chainedMock;
    });

    const res = await app.request('/admin/prompt-test/history?themeSlug=garden_studio', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should filter by isFavorite', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });
      return chainedMock;
    });

    const res = await app.request('/admin/prompt-test/history?isFavorite=true', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// =============================================================================
// Tests: GET /admin/prompt-test/history/:id
// =============================================================================

describe('GET /admin/prompt-test/history/:id', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 404 when test not found', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('TEST_NOT_FOUND');
  });

  it('should return test details with assembled prompts', async () => {
    const mockTest = {
      id: TEST_TEST_ID,
      user_id: TEST_USER_ID,
      theme_slug: 'white_studio',
      shot_type: 'full_body',
      prompt_overrides: null,
      node_overrides: null,
      seed: 12345,
      extra_style_tags: null,
      groom_lora_url: MOCK_GROOM_LORA_URL,
      bride_lora_url: MOCK_BRIDE_LORA_URL,
      images: [],
      generation_time_ms: 42000,
      assembled_prompts: {
        node6MainPositive: 'Test prompt...',
        node7MainNegative: 'illustration...',
        node21GroomFace: 'GROOM_SDME, ...',
        node26GroomFaceNegative: 'woman...',
        node23BrideFace: 'BRIDE_SDME, ...',
        node27BrideFaceNegative: 'man...',
        node38HandPositive: 'detailed hands...',
        node39HandNegative: '',
      },
      status: 'completed',
      progress: 1,
      total_count: 1,
      error_message: null,
      quality_issues: ['finger_broken'],
      notes: 'Test notes',
      is_favorite: true,
      created_at: new Date().toISOString(),
    };

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: mockTest,
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(TEST_TEST_ID);
    expect(body.data.assembledPrompts.node6MainPositive).toBe('Test prompt...');
    expect(body.data.qualityIssues).toContain('finger_broken');
    expect(body.data.isFavorite).toBe(true);
  });
});

// =============================================================================
// Tests: PUT /admin/prompt-test/history/:id
// =============================================================================

describe('PUT /admin/prompt-test/history/:id', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should update quality issues', async () => {
    const mockUpdatedTest = {
      id: TEST_TEST_ID,
      user_id: TEST_USER_ID,
      theme_slug: 'white_studio',
      shot_type: 'full_body',
      prompt_overrides: null,
      node_overrides: null,
      seed: 12345,
      extra_style_tags: null,
      groom_lora_url: MOCK_GROOM_LORA_URL,
      bride_lora_url: MOCK_BRIDE_LORA_URL,
      images: [],
      generation_time_ms: 42000,
      assembled_prompts: {},
      status: 'completed',
      progress: 1,
      total_count: 1,
      error_message: null,
      quality_issues: ['finger_broken', 'hand_distorted'],
      notes: null,
      is_favorite: false,
      created_at: new Date().toISOString(),
    };

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: mockUpdatedTest,
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        qualityIssues: ['finger_broken', 'hand_distorted'],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.qualityIssues).toEqual(['finger_broken', 'hand_distorted']);
  });

  it('should update notes', async () => {
    const mockUpdatedTest = {
      id: TEST_TEST_ID,
      user_id: TEST_USER_ID,
      theme_slug: 'white_studio',
      shot_type: 'full_body',
      prompt_overrides: null,
      node_overrides: null,
      seed: 12345,
      extra_style_tags: null,
      groom_lora_url: MOCK_GROOM_LORA_URL,
      bride_lora_url: MOCK_BRIDE_LORA_URL,
      images: [],
      generation_time_ms: 42000,
      assembled_prompts: {},
      status: 'completed',
      progress: 1,
      total_count: 1,
      error_message: null,
      quality_issues: null,
      notes: 'Updated notes',
      is_favorite: false,
      created_at: new Date().toISOString(),
    };

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: mockUpdatedTest,
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        notes: 'Updated notes',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.notes).toBe('Updated notes');
  });

  it('should toggle favorite status', async () => {
    const mockUpdatedTest = {
      id: TEST_TEST_ID,
      user_id: TEST_USER_ID,
      theme_slug: 'white_studio',
      shot_type: 'full_body',
      prompt_overrides: null,
      node_overrides: null,
      seed: 12345,
      extra_style_tags: null,
      groom_lora_url: MOCK_GROOM_LORA_URL,
      bride_lora_url: MOCK_BRIDE_LORA_URL,
      images: [],
      generation_time_ms: 42000,
      assembled_prompts: {},
      status: 'completed',
      progress: 1,
      total_count: 1,
      error_message: null,
      quality_issues: null,
      notes: null,
      is_favorite: true,
      created_at: new Date().toISOString(),
    };

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: mockUpdatedTest,
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        isFavorite: true,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.isFavorite).toBe(true);
  });
});

// =============================================================================
// Tests: DELETE /admin/prompt-test/history/:id
// =============================================================================

describe('DELETE /admin/prompt-test/history/:id', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should delete test successfully', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should return 500 on database error', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      chainedMock.delete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });
      return chainedMock;
    });

    const res = await app.request(`/admin/prompt-test/history/${TEST_TEST_ID}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
