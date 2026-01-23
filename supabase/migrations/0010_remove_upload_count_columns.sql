-- Migration: Remove upload count columns from projects table
-- These columns are no longer needed as we now calculate counts dynamically
-- by JOINing the uploads table

-- Remove the columns
ALTER TABLE public.projects
DROP COLUMN IF EXISTS groom_upload_count,
DROP COLUMN IF EXISTS bride_upload_count;
