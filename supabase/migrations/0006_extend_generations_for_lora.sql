-- Migration: Extend generations table for LoRA training support
-- Description: Add columns to track Fal.ai LoRA training jobs for both groom and bride

-- Add LoRA training columns
ALTER TABLE generations ADD COLUMN IF NOT EXISTS groom_fal_job_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS groom_lora_url TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS bride_fal_job_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS bride_lora_url TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ;

-- Create indexes for webhook lookup by Fal job ID
CREATE INDEX IF NOT EXISTS idx_generations_groom_fal_job_id ON generations(groom_fal_job_id) WHERE groom_fal_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generations_bride_fal_job_id ON generations(bride_fal_job_id) WHERE bride_fal_job_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN generations.groom_fal_job_id IS 'Fal.ai request ID for groom LoRA training';
COMMENT ON COLUMN generations.groom_lora_url IS 'URL to trained groom LoRA weights file';
COMMENT ON COLUMN generations.bride_fal_job_id IS 'Fal.ai request ID for bride LoRA training';
COMMENT ON COLUMN generations.bride_lora_url IS 'URL to trained bride LoRA weights file';
COMMENT ON COLUMN generations.training_completed_at IS 'Timestamp when both LoRA trainings completed';
