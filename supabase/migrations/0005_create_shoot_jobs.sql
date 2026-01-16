-- Migration: Create shoot_jobs table for E2E shooting pipeline
-- Version: 0005
-- Description: Creates shoot_jobs table for managing Fal.ai LoRA training and Modal image generation

-- ==========================================
-- SHOOT_JOBS TABLE
-- State machine: training_queued → training → standby → generating → complete | failed
-- ==========================================
CREATE TABLE IF NOT EXISTS public.shoot_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id),

    -- Status tracking
    status VARCHAR(30) NOT NULL DEFAULT 'training_queued',

    -- Fal.ai LoRA training (groom)
    groom_fal_job_id TEXT,
    groom_lora_url TEXT,

    -- Fal.ai LoRA training (bride)
    bride_fal_job_id TEXT,
    bride_lora_url TEXT,

    -- Training timestamps
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,

    -- Modal image generation
    modal_job_id TEXT,
    generation_started_at TIMESTAMPTZ,
    generation_completed_at TIMESTAMPTZ,
    generation_params JSONB DEFAULT '{}',

    -- Generated images array
    -- Format: [{ url: string, blur_url: string, thumbnail_url: string }]
    images JSONB DEFAULT '[]',

    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.shoot_jobs IS 'E2E shooting pipeline jobs: Fal.ai LoRA training → Modal image generation';

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_shoot_jobs_project_id ON public.shoot_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_shoot_jobs_user_id ON public.shoot_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_shoot_jobs_status ON public.shoot_jobs(status);
CREATE INDEX IF NOT EXISTS idx_shoot_jobs_groom_fal_job_id ON public.shoot_jobs(groom_fal_job_id);
CREATE INDEX IF NOT EXISTS idx_shoot_jobs_bride_fal_job_id ON public.shoot_jobs(bride_fal_job_id);

-- ==========================================
-- TRIGGER: Auto-update updated_at
-- ==========================================
CREATE TRIGGER update_shoot_jobs_updated_at
    BEFORE UPDATE ON public.shoot_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE public.shoot_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own shoot jobs
CREATE POLICY "Users can read own shoot_jobs"
    ON public.shoot_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own shoot jobs
CREATE POLICY "Users can insert own shoot_jobs"
    ON public.shoot_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access shoot_jobs"
    ON public.shoot_jobs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- CHECK CONSTRAINT: Valid status values
-- ==========================================
ALTER TABLE public.shoot_jobs
    ADD CONSTRAINT shoot_jobs_status_check
    CHECK (status IN ('training_queued', 'training', 'standby', 'generating', 'complete', 'failed'));
