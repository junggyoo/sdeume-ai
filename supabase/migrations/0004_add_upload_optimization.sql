-- Migration: Add upload optimization columns
-- Version: 0004
-- Description: Adds current_step to projects and crop fields to uploads for Smart Mix feature

-- ==========================================
-- 1. Add current_step to projects
-- ==========================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;

COMMENT ON COLUMN public.projects.current_step IS 'Current step in studio flow: 1=Upload, 2=Optimize, 3=Theme, 4=Shooting, 5=Reveal';

-- ==========================================
-- 2. Add crop fields to uploads
-- ==========================================
ALTER TABLE public.uploads
ADD COLUMN IF NOT EXISTS crop_mode VARCHAR(20) DEFAULT 'original';

ALTER TABLE public.uploads
ADD COLUMN IF NOT EXISTS crop_rect JSONB;

COMMENT ON COLUMN public.uploads.crop_mode IS 'Crop mode: original, face (tight crop), body (loose crop with shoulders)';
COMMENT ON COLUMN public.uploads.crop_rect IS 'Crop rectangle coordinates: { x, y, width, height }';

-- ==========================================
-- 3. Add groom/bride upload counts to projects
-- ==========================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS groom_upload_count INTEGER DEFAULT 0;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS bride_upload_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.projects.groom_upload_count IS 'Number of groom photos uploaded';
COMMENT ON COLUMN public.projects.bride_upload_count IS 'Number of bride photos uploaded';
