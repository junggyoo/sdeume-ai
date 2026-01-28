-- =============================================================================
-- Admin Prompt Tests Table
-- For storing prompt/workflow parameter test results
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_prompt_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic settings
    theme_slug VARCHAR(50) NOT NULL,
    shot_type VARCHAR(20) NOT NULL,

    -- Prompt overrides (modified parts only)
    prompt_overrides JSONB,

    -- Node settings overrides
    node_overrides JSONB,

    -- Generation settings
    seed BIGINT,
    extra_style_tags TEXT,

    -- LoRA info
    groom_lora_url TEXT,
    bride_lora_url TEXT,

    -- Results
    images JSONB,                -- [{base64, contentType, width, height}]
    generation_time_ms INTEGER,

    -- Assembled prompts (for reproducibility - ComfyUI copy/paste)
    assembled_prompts JSONB NOT NULL,

    -- Evaluation: quality issue tagging
    quality_issues TEXT[],       -- ['finger_broken', 'skin_blurry', 'face_distorted', ...]
    notes TEXT,

    -- Flags
    is_favorite BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_admin_prompt_tests_theme ON admin_prompt_tests(theme_slug);
CREATE INDEX idx_admin_prompt_tests_created ON admin_prompt_tests(created_at DESC);
CREATE INDEX idx_admin_prompt_tests_favorite ON admin_prompt_tests(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_admin_prompt_tests_user ON admin_prompt_tests(user_id);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE admin_prompt_tests IS 'Admin prompt/workflow testing results for quality optimization';
COMMENT ON COLUMN admin_prompt_tests.prompt_overrides IS 'Custom prompt modifications per node';
COMMENT ON COLUMN admin_prompt_tests.node_overrides IS 'ComfyUI node parameter overrides (denoise, steps, cfg, etc.)';
COMMENT ON COLUMN admin_prompt_tests.assembled_prompts IS 'Final assembled prompts for ComfyUI reproducibility';
COMMENT ON COLUMN admin_prompt_tests.quality_issues IS 'Array of quality issue tags for filtering and analysis';

-- =============================================================================
-- Note: No RLS policies (hidden admin page, URL-only access)
-- =============================================================================
