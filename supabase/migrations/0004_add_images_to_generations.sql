-- Migration: Add images JSONB column to generations table
-- Version: 0004
-- Description: Stores generated image data for mock API responses

ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

COMMENT ON COLUMN public.generations.images IS 'Array of generated images: [{"url": "...", "is_blur": boolean}, ...]';
