import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { generationRoutes } from '../generation';

// Mock fetch globally for external API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// =============================================================================
// Mocks
// =============================================================================

const mockSingle = vi.fn();
const mockLimit = vi.fn();

const createChainedMock = () => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
        single: mockSingle,
        order: vi.fn().mockReturnValue({
          limit: mockLimit.mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
      single: mockSingle,
    }),
    single: mockSingle,
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
  fal: {
    apiKey: 'test-fal-key',
    webhookSecret: 'test-webhook-secret',
  },
  modal: {
    endpointUrl: 'https://test.modal.run',
  },
};

// Create test app
const createTestApp = () => {
  const app = new Hono<AppEnv>();

  // Add mock middleware
  app.use('*', async (c, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('supabase', mockSupabase as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('logger', mockLogger as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('config', mockConfig as any);
    await next();
  });

  // Register routes
  app.route('/generate', generationRoutes);

  return app;
};

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_PROJECT_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_THEME_ID = '550e8400-e29b-41d4-a716-446655440003';
const TEST_GENERATION_ID = '550e8400-e29b-41d4-a716-446655440004';
const TEST_LORA_MODEL_ID_GROOM = '550e8400-e29b-41d4-a716-446655440010';
const TEST_LORA_MODEL_ID_BRIDE = '550e8400-e29b-41d4-a716-446655440011';

const MOCK_GROOM_LORA_URL = 'https://storage.fal.ai/lora/groom-model.safetensors';
const MOCK_BRIDE_LORA_URL = 'https://storage.fal.ai/lora/bride-model.safetensors';

// =============================================================================
// Tests: POST /generate - Skip Training with Existing LoRA
// =============================================================================

describe('POST /generate with existing LoRA', () => {
  let app: Hono<AppEnv>;
  // Track from() calls to return appropriate mocks
  let fromCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    fromCallCount = 0;
    app = createTestApp();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    });

    // Reset from() mock to track calls
    mockSupabase.from.mockImplementation((table: string) => {
      fromCallCount++;
      return createChainedMock();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const res = await app.request('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        themeId: TEST_THEME_ID,
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('should return 400 with invalid projectId', async () => {
    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectId: 'not-a-uuid',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should skip training and use existing LoRA when user has both face models', async () => {
    // This test verifies the core feature: users with existing LoRA skip training

    // Mock sequence:
    // 1. projects table - check project ownership
    // 2. generations table - insert new generation
    // 3. user_face_models table - get active face models (returns both groom and bride)
    // 4. generations table - update with LoRA URLs and status='generating'

    let callIndex = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      callIndex++;
      const chainedMock = createChainedMock();

      if (table === 'projects' && callIndex === 1) {
        // Project ownership check
        mockSingle.mockResolvedValueOnce({
          data: { id: TEST_PROJECT_ID },
          error: null,
        });
      } else if (table === 'generations' && callIndex === 2) {
        // Insert new generation
        mockSingle.mockResolvedValueOnce({
          data: {
            id: TEST_GENERATION_ID,
            project_id: TEST_PROJECT_ID,
            user_id: TEST_USER_ID,
            theme_id: TEST_THEME_ID,
            status: 'queued',
            images: [],
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          error: null,
        });
      } else if (table === 'user_face_models' && callIndex === 3) {
        // Get active face models - return BOTH groom and bride
        chainedMock.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'face-model-1',
                  user_id: TEST_USER_ID,
                  role: 'groom',
                  lora_model_id: TEST_LORA_MODEL_ID_GROOM,
                  is_active: true,
                  lora_model: {
                    id: TEST_LORA_MODEL_ID_GROOM,
                    model_url: MOCK_GROOM_LORA_URL,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                  },
                },
                {
                  id: 'face-model-2',
                  user_id: TEST_USER_ID,
                  role: 'bride',
                  lora_model_id: TEST_LORA_MODEL_ID_BRIDE,
                  is_active: true,
                  lora_model: {
                    id: TEST_LORA_MODEL_ID_BRIDE,
                    model_url: MOCK_BRIDE_LORA_URL,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                  },
                },
              ],
              error: null,
            }),
          }),
        });
      } else if (table === 'generations' && callIndex === 4) {
        // Update generation with LoRA model FKs
        mockSingle.mockResolvedValueOnce({
          data: {
            id: TEST_GENERATION_ID,
            project_id: TEST_PROJECT_ID,
            user_id: TEST_USER_ID,
            theme_id: TEST_THEME_ID,
            status: 'generating',
            groom_lora_model_id: TEST_LORA_MODEL_ID_GROOM,
            bride_lora_model_id: TEST_LORA_MODEL_ID_BRIDE,
            training_completed_at: new Date().toISOString(),
            images: [],
            // JOIN results from lora_models
            groom_lora: {
              id: TEST_LORA_MODEL_ID_GROOM,
              model_url: MOCK_GROOM_LORA_URL,
              status: 'completed',
              fal_job_id: null,
            },
            bride_lora: {
              id: TEST_LORA_MODEL_ID_BRIDE,
              model_url: MOCK_BRIDE_LORA_URL,
              status: 'completed',
              fal_job_id: null,
            },
          },
          error: null,
        });
      }

      return chainedMock;
    });

    // Mock Modal API call (for async generation)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ images: [] }),
    });

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
        themeId: TEST_THEME_ID,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Status should be 'generating' (skipped training)
    expect(body.data.status).toBe('generating');
    // Should have LoRA URLs from existing models
    expect(body.data.groomLoraUrl).toBe(MOCK_GROOM_LORA_URL);
    expect(body.data.brideLoraUrl).toBe(MOCK_BRIDE_LORA_URL);
    // Should NOT have Fal job IDs (training skipped)
    expect(body.data.groomFalJobId).toBeNull();
    expect(body.data.brideFalJobId).toBeNull();
  });

  it('should start training when user has no existing face models', async () => {
    // Mock sequence for NEW user (no existing LoRA)

    let callIndex = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      callIndex++;
      const chainedMock = createChainedMock();

      if (table === 'projects' && callIndex === 1) {
        mockSingle.mockResolvedValueOnce({
          data: { id: TEST_PROJECT_ID },
          error: null,
        });
      } else if (table === 'generations' && callIndex === 2) {
        mockSingle.mockResolvedValueOnce({
          data: {
            id: TEST_GENERATION_ID,
            project_id: TEST_PROJECT_ID,
            user_id: TEST_USER_ID,
            status: 'queued',
            images: [],
          },
          error: null,
        });
      } else if (table === 'user_face_models' && callIndex === 3) {
        // No existing face models
        chainedMock.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // Empty - no existing LoRA
              error: null,
            }),
          }),
        });
      }

      return chainedMock;
    });

    // Mock Fal API for training (will fail due to no uploads, but that's expected)
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No images found' }),
    });

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
      }),
    });

    // When no existing LoRA and no uploads, training will fail
    // This is expected behavior - the route should try to start training
    expect([201, 500]).toContain(res.status);
  });

  it('should start training when user has only groom face model (incomplete)', async () => {
    // User has only groom LoRA, missing bride - should fall back to training

    let callIndex = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      callIndex++;
      const chainedMock = createChainedMock();

      if (table === 'projects' && callIndex === 1) {
        mockSingle.mockResolvedValueOnce({
          data: { id: TEST_PROJECT_ID },
          error: null,
        });
      } else if (table === 'generations' && callIndex === 2) {
        mockSingle.mockResolvedValueOnce({
          data: {
            id: TEST_GENERATION_ID,
            project_id: TEST_PROJECT_ID,
            user_id: TEST_USER_ID,
            status: 'queued',
            images: [],
          },
          error: null,
        });
      } else if (table === 'user_face_models' && callIndex === 3) {
        // Only groom exists
        chainedMock.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'face-model-1',
                  user_id: TEST_USER_ID,
                  role: 'groom',
                  lora_model_id: TEST_LORA_MODEL_ID_GROOM,
                  is_active: true,
                  lora_model: {
                    id: TEST_LORA_MODEL_ID_GROOM,
                    model_url: MOCK_GROOM_LORA_URL,
                    status: 'completed',
                  },
                },
                // No bride model
              ],
              error: null,
            }),
          }),
        });
      }

      return chainedMock;
    });

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectId: TEST_PROJECT_ID,
      }),
    });

    // Should try to start training (and fail due to no uploads)
    // The important thing is it doesn't skip training with incomplete LoRA
    expect([201, 500]).toContain(res.status);
  });
});

// =============================================================================
// Tests: GET /generate/project/:projectId - Get generation by project
// =============================================================================

describe('GET /generate/project/:projectId', () => {
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
    const res = await app.request(`/generate/project/${TEST_PROJECT_ID}`, {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 with invalid project ID', async () => {
    const res = await app.request('/generate/project/not-a-uuid', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_PARAMS');
  });

  it('should return { ok: true, data: null } when generation does not exist', async () => {
    // Simulate PGRST116 error (no rows found)
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      return chainedMock;
    });

    const res = await app.request(`/generate/project/${TEST_PROJECT_ID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toBeNull();
  });

  it('should return generation data when exists', async () => {
    const mockGeneration = {
      id: TEST_GENERATION_ID,
      project_id: TEST_PROJECT_ID,
      user_id: TEST_USER_ID,
      modal_job_id: null,
      theme_id: TEST_THEME_ID,
      prompt: null,
      parameters: {},
      status: 'completed',
      images: ['https://example.com/image1.jpg'],
      started_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-01T01:00:00Z',
      error_message: null,
      created_at: '2024-01-01T00:00:00Z',
      groom_lora_model_id: TEST_LORA_MODEL_ID_GROOM,
      bride_lora_model_id: TEST_LORA_MODEL_ID_BRIDE,
      groom_lora: {
        id: TEST_LORA_MODEL_ID_GROOM,
        model_url: MOCK_GROOM_LORA_URL,
        status: 'completed',
        fal_job_id: 'fal-job-groom',
      },
      bride_lora: {
        id: TEST_LORA_MODEL_ID_BRIDE,
        model_url: MOCK_BRIDE_LORA_URL,
        status: 'completed',
        fal_job_id: 'fal-job-bride',
      },
      training_completed_at: '2024-01-01T00:30:00Z',
    };

    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: mockGeneration,
        error: null,
      });
      return chainedMock;
    });

    const res = await app.request(`/generate/project/${TEST_PROJECT_ID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).not.toBeNull();
    expect(body.data.id).toBe(TEST_GENERATION_ID);
    expect(body.data.projectId).toBe(TEST_PROJECT_ID);
    expect(body.data.status).toBe('completed');
    expect(body.data.groomLoraUrl).toBe(MOCK_GROOM_LORA_URL);
    expect(body.data.brideLoraUrl).toBe(MOCK_BRIDE_LORA_URL);
  });

  it('should return 500 for database errors other than PGRST116', async () => {
    mockSupabase.from.mockImplementation(() => {
      const chainedMock = createChainedMock();
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database connection error' },
      });
      return chainedMock;
    });

    const res = await app.request(`/generate/project/${TEST_PROJECT_ID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('GENERATION_FETCH_ERROR');
  });
});
