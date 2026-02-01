import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { adminPromptTestRoutes } from '../admin-prompt-test';

// Mock fetch globally for Modal API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
// Tests: POST /admin/prompt-test/generate
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

  it('should generate test image with default settings', async () => {
    // Mock Modal API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        images: [
          {
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            content_type: 'image/png',
            width: 896,
            height: 1152,
            status: 'success',
          },
        ],
      }),
    });

    // Mock database insert
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
    expect(body.data.assembledPrompts).toBeDefined();
    expect(body.data.images).toHaveLength(1);
  });

  it('should apply prompt overrides when provided', async () => {
    const promptOverrides = {
      mainPositive: 'Custom main positive prompt',
      groomFacePositive: 'Custom groom face prompt',
    };

    // Mock Modal API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        images: [{ base64: 'test', content_type: 'image/png', width: 896, height: 1152 }],
      }),
    });

    // Mock database insert
    mockSingle.mockResolvedValueOnce({
      data: {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: promptOverrides,
        node_overrides: null,
        seed: 12345,
        extra_style_tags: null,
        groom_lora_url: MOCK_GROOM_LORA_URL,
        bride_lora_url: MOCK_BRIDE_LORA_URL,
        images: [],
        generation_time_ms: 42000,
        assembled_prompts: {
          node6MainPositive: 'Custom main positive prompt',
          node7MainNegative: 'illustration...',
          node21GroomFace: 'GROOM_SDME, Custom groom face prompt',
          node26GroomFaceNegative: 'woman...',
          node23BrideFace: 'BRIDE_SDME, ...',
          node27BrideFaceNegative: 'man...',
          node38HandPositive: 'detailed hands...',
          node39HandNegative: '',
        },
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
        promptOverrides,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.assembledPrompts.node6MainPositive).toContain('Custom main positive prompt');
  });

  it('should apply node overrides when provided', async () => {
    const nodeOverrides = {
      groomDenoise: 0.5,
      brideDenoise: 0.4,
      cfg: 2,
      steps: 30,
    };

    // Mock Modal API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        images: [{ base64: 'test', content_type: 'image/png', width: 896, height: 1152 }],
      }),
    });

    // Mock database insert
    mockSingle.mockResolvedValueOnce({
      data: {
        id: TEST_TEST_ID,
        user_id: TEST_USER_ID,
        theme_slug: 'white_studio',
        shot_type: 'full_body',
        prompt_overrides: null,
        node_overrides: nodeOverrides,
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
        nodeOverrides,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify Modal API was called with node overrides
    expect(mockFetch).toHaveBeenCalled();
    const fetchCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchCallBody.nodeOverrides).toEqual(nodeOverrides);
  });

  it('should handle Modal API error gracefully', async () => {
    // Mock Modal API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
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
    expect(body.error.code).toBe('GENERATION_ERROR');
  });

  it('should handle Modal API timeout', async () => {
    // Mock timeout error
    mockFetch.mockRejectedValueOnce(new Error('AbortError: Request timed out'));

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

    expect(res.status).toBe(408);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('GENERATION_TIMEOUT');
  });

  // ===========================================================================
  // Batch parallel processing tests (count > 4)
  // ===========================================================================

  it('should split count=8 into 2 parallel batches (4+4)', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    // Each batch returns 4 images
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      });

    // Mock database insert
    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 8,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(8);
    // Should have made 2 fetch calls (2 batches of 4)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should split count=12 into 3 parallel batches (4+4+4)', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    // Each batch returns 4 images
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      });

    // Mock database insert
    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 12,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(12);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should split count=5 into 2 batches (4+1)', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage] }),
      });

    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 5,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(5);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not batch when count <= 4 (single request)', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: [mockImage, mockImage, mockImage] }),
    });

    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 3,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return partial results when one batch fails in multi-batch', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    // First batch succeeds, second batch fails
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 8,
      }),
    });

    // Should still succeed with partial results
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(4);
  });

  it('should return 500 when all batches fail in multi-batch', async () => {
    // Both batches fail
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
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
        count: 8,
      }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('GENERATION_ERROR');
  });

  it('should not batch when count=4 (boundary value, single request)', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
    });

    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
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
        count: 4,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.images).toHaveLength(4);
    // Should be a single fetch call, no batching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when count exceeds max (13)', async () => {
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
        count: 13,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should pass correct count per batch to Modal API', async () => {
    const mockImage = { base64: 'test', content_type: 'image/png', width: 896, height: 1152 };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage, mockImage, mockImage] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [mockImage, mockImage] }),
      });

    mockSingle.mockResolvedValueOnce({
      data: { id: TEST_TEST_ID },
      error: null,
    });

    await app.request('/admin/prompt-test/generate', {
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
        count: 6,
      }),
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    // First batch: count=4
    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(firstCallBody.count).toBe(4);
    // Second batch: count=2
    const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondCallBody.count).toBe(2);
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
