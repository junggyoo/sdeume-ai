-- Migration: Create user_face_models table
-- Version: 0007
-- Description: Creates user_face_models table to store user's active face models (LoRA) for reuse

-- ==========================================
-- 1. CREATE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_face_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('bride', 'groom')),
    lora_model_id UUID REFERENCES public.lora_models(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_face_models IS 'User face models linking users to their trained LoRA models for reuse';
COMMENT ON COLUMN public.user_face_models.role IS 'Role of the face model: bride or groom';
COMMENT ON COLUMN public.user_face_models.lora_model_id IS 'Reference to the trained LoRA model';
COMMENT ON COLUMN public.user_face_models.is_active IS 'Whether this is the current active model for the user/role';

-- ==========================================
-- 2. INDEXES
-- ==========================================
-- Index for looking up models by user
CREATE INDEX IF NOT EXISTS idx_user_face_models_user_id
    ON public.user_face_models(user_id);

-- Unique partial index: only one active model per user+role combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_face_models_active_unique
    ON public.user_face_models(user_id, role)
    WHERE is_active = true;

-- Index for lora_model_id lookups
CREATE INDEX IF NOT EXISTS idx_user_face_models_lora_model_id
    ON public.user_face_models(lora_model_id)
    WHERE lora_model_id IS NOT NULL;

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.user_face_models ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own face models
CREATE POLICY "Users can view own face models"
    ON public.user_face_models
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own face models
CREATE POLICY "Users can insert own face models"
    ON public.user_face_models
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own face models
CREATE POLICY "Users can update own face models"
    ON public.user_face_models
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own face models
CREATE POLICY "Users can delete own face models"
    ON public.user_face_models
    FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================
-- 4. TRIGGER for updated_at
-- ==========================================
CREATE TRIGGER update_user_face_models_updated_at
    BEFORE UPDATE ON public.user_face_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
