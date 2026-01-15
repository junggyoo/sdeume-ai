-- Migration: Create core tables for Sdeume AI
-- Version: 0002
-- Description: Creates users, profiles, projects, uploads, lora_models, themes, images, plans, entitlements tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE (extends auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';

-- ==========================================
-- 2. PLANS TABLE (Pricing tiers)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'basic', 'pro', 'max'
    display_name VARCHAR(50) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0, -- Price in KRW
    theme_count INTEGER NOT NULL DEFAULT 1, -- Number of themes allowed
    image_count INTEGER NOT NULL DEFAULT 4, -- Number of images generated
    reroll_count INTEGER NOT NULL DEFAULT 0, -- Number of re-rolls allowed
    retouch_count INTEGER NOT NULL DEFAULT 0, -- Number of retouches allowed
    has_watermark BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plans IS 'Subscription/purchase plans (Free, Basic, Pro, Max)';

-- Insert default plans
INSERT INTO public.plans (name, display_name, price, theme_count, image_count, reroll_count, retouch_count, has_watermark) VALUES
    ('free', '무료 체험', 0, 1, 4, 0, 0, true),
    ('basic', 'Basic', 19900, 1, 12, 1, 0, false),
    ('pro', 'Pro', 49000, 3, 36, 3, 5, false),
    ('max', 'Max', 99000, -1, 60, -1, -1, false) -- -1 means unlimited
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 3. THEMES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'white_studio'
    display_name_ko VARCHAR(100) NOT NULL,
    description_ko TEXT,
    config JSONB NOT NULL DEFAULT '{}', -- bgm_url, sample_urls, prompt_trigger, transitions
    recommendation_tags TEXT[] DEFAULT '{}', -- ['smile', 'bright', 'clean']
    thumbnail_url TEXT,
    motion_thumbnail_url TEXT, -- Cinemagraph URL
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.themes IS 'Available themes for photo generation';

-- Insert default themes (MVP 3종)
INSERT INTO public.themes (name, display_name_ko, description_ko, recommendation_tags, sort_order) VALUES
    ('white_studio', '화이트 스튜디오', '깔끔하고 미니멀한 자연광 스튜디오', ARRAY['clean', 'minimal', 'bright'], 1),
    ('garden_studio', '가든 스튜디오', '초록 정원과 따뜻한 햇살, 아름다운 보케', ARRAY['smile', 'warm', 'natural'], 2),
    ('classic_studio', '클래식 스튜디오', '웅장한 샹들리에와 호텔 예식 분위기', ARRAY['elegant', 'formal', 'luxury'], 3)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 4. PROJECTS TABLE (User's generation projects)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'uploading', 'training', 'generating', 'completed', 'failed'
    selected_theme_id UUID REFERENCES public.themes(id),
    plan_id UUID REFERENCES public.plans(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'User generation projects containing uploads and results';

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ==========================================
-- 5. UPLOADS TABLE (User uploaded images)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'bride', -- 'bride' or 'groom'
    original_url TEXT NOT NULL,
    cropped_url TEXT, -- After Smart Mix processing
    bucket_type VARCHAR(20), -- 'front', 'side', 'expression'
    -- MediaPipe analysis metadata
    face_yaw FLOAT, -- Face angle
    smile_score FLOAT, -- Expression score
    quality_score FLOAT, -- Image quality score
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.uploads IS 'User uploaded images for LoRA training';

CREATE INDEX IF NOT EXISTS idx_uploads_project_id ON public.uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON public.uploads(user_id);

-- ==========================================
-- 6. LORA_MODELS TABLE (Trained models)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.lora_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'bride' or 'groom'
    fal_job_id TEXT, -- Fal.ai job ID
    model_url TEXT, -- Trained LoRA model URL
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'training', 'completed', 'failed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lora_models IS 'Trained LoRA models from Fal.ai';

CREATE INDEX IF NOT EXISTS idx_lora_models_project_id ON public.lora_models(project_id);

-- ==========================================
-- 7. GENERATIONS TABLE (Image generation jobs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    modal_job_id TEXT, -- Modal job ID
    theme_id UUID REFERENCES public.themes(id),
    prompt TEXT,
    parameters JSONB DEFAULT '{}', -- Generation parameters
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.generations IS 'Image generation job records';

CREATE INDEX IF NOT EXISTS idx_generations_project_id ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);

-- ==========================================
-- 8. IMAGES TABLE (Generated images)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Clean image URL (for paid users)
    blur_url TEXT, -- Blurred preview URL
    watermark_url TEXT, -- Watermarked image URL (for free users)
    thumbnail_url TEXT,
    has_watermark BOOLEAN DEFAULT true,
    face_similarity_score FLOAT, -- 0.0 ~ 1.0 for refund eligibility
    is_selected BOOLEAN DEFAULT false, -- User's selected best shots
    is_rerolled BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.images IS 'Generated images from AI pipeline';

CREATE INDEX IF NOT EXISTS idx_images_generation_id ON public.images(generation_id);
CREATE INDEX IF NOT EXISTS idx_images_project_id ON public.images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);

-- ==========================================
-- 9. ENTITLEMENTS TABLE (User's plan usage)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    remaining_images INTEGER NOT NULL DEFAULT 0,
    remaining_rerolls INTEGER NOT NULL DEFAULT 0,
    remaining_retouches INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.entitlements IS 'User entitlements based on purchased plan';

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_project_id ON public.entitlements(project_id);

-- ==========================================
-- 10. PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.plans(id),
    toss_payment_key TEXT UNIQUE, -- Toss Payments payment key
    toss_order_id TEXT,
    amount INTEGER NOT NULL, -- Amount in KRW
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Payment records from Toss Payments';

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ==========================================
-- 11. RETOUCHES TABLE (Retouch requests)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.retouches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(30) NOT NULL, -- 'skin', 'body', 'background', 'face'
    prompt_override TEXT,
    result_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.retouches IS 'User retouch requests for generated images';

CREATE INDEX IF NOT EXISTS idx_retouches_image_id ON public.retouches(image_id);
CREATE INDEX IF NOT EXISTS idx_retouches_user_id ON public.retouches(user_id);

-- ==========================================
-- 12. VIDEOS TABLE (Viral Movie Maker)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    selected_image_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.videos IS 'Generated viral movie videos';

CREATE INDEX IF NOT EXISTS idx_videos_project_id ON public.videos(project_id);

-- ==========================================
-- TRIGGERS: Auto-update updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTION: Auto-create profile on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
