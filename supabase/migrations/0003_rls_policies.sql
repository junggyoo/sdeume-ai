-- Migration: Row Level Security (RLS) Policies
-- Version: 0003
-- Description: Enable RLS and create security policies for all tables

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lora_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow insert for new users (via trigger)
CREATE POLICY "Enable insert for authenticated users only"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- PLANS POLICIES (Public read)
-- ==========================================
-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
    ON public.plans FOR SELECT
    USING (is_active = true);

-- ==========================================
-- THEMES POLICIES (Public read)
-- ==========================================
-- Anyone can view active themes
CREATE POLICY "Anyone can view active themes"
    ON public.themes FOR SELECT
    USING (is_active = true);

-- ==========================================
-- PROJECTS POLICIES
-- ==========================================
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================
-- UPLOADS POLICIES
-- ==========================================
-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
    ON public.uploads FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create uploads for their projects
CREATE POLICY "Users can create own uploads"
    ON public.uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update own uploads"
    ON public.uploads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
    ON public.uploads FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================
-- LORA_MODELS POLICIES
-- ==========================================
-- Users can view their own LoRA models
CREATE POLICY "Users can view own lora models"
    ON public.lora_models FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create LoRA models for their projects
CREATE POLICY "Users can create own lora models"
    ON public.lora_models FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- GENERATIONS POLICIES
-- ==========================================
-- Users can view their own generations
CREATE POLICY "Users can view own generations"
    ON public.generations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create generations for their projects
CREATE POLICY "Users can create own generations"
    ON public.generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- IMAGES POLICIES
-- ==========================================
-- Users can view their own images
CREATE POLICY "Users can view own images"
    ON public.images FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own images (for selection/sorting)
CREATE POLICY "Users can update own images"
    ON public.images FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- ENTITLEMENTS POLICIES
-- ==========================================
-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements"
    ON public.entitlements FOR SELECT
    USING (auth.uid() = user_id);

-- ==========================================
-- PAYMENTS POLICIES
-- ==========================================
-- Users can view their own payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create payments (initial payment record)
CREATE POLICY "Users can create own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- RETOUCHES POLICIES
-- ==========================================
-- Users can view their own retouches
CREATE POLICY "Users can view own retouches"
    ON public.retouches FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create retouches for their images
CREATE POLICY "Users can create own retouches"
    ON public.retouches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- VIDEOS POLICIES
-- ==========================================
-- Users can view their own videos
CREATE POLICY "Users can view own videos"
    ON public.videos FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create videos for their projects
CREATE POLICY "Users can create own videos"
    ON public.videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- SERVICE ROLE BYPASS POLICIES
-- (For backend operations using service_role key)
-- ==========================================
-- Note: Service role key automatically bypasses RLS
-- These are implicit and don't need explicit policies

-- ==========================================
-- STORAGE POLICIES (if using Supabase Storage)
-- ==========================================
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('uploads', 'uploads', false),
    ('generated', 'generated', false),
    ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('uploads', 'generated', 'videos')
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policy: Users can view their own files
CREATE POLICY "Users can view own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN ('uploads', 'generated', 'videos')
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policy: Users can update their own files
CREATE POLICY "Users can update own files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id IN ('uploads', 'generated', 'videos')
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id IN ('uploads', 'generated', 'videos')
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
