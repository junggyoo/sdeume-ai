-- Migration: Refactor generations table to use lora_models FK
-- Version: 0009
-- Description:
--   1. Add FK columns to generations referencing lora_models
--   2. Create index on lora_models.fal_job_id for webhook lookups
--   3. Migrate existing LoRA data from generations to lora_models
--   4. Link generations to lora_models via FK

-- ==========================================
-- 1. ADD FK COLUMNS TO GENERATIONS
-- ==========================================
ALTER TABLE generations ADD COLUMN IF NOT EXISTS groom_lora_model_id UUID REFERENCES lora_models(id) ON DELETE SET NULL;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS bride_lora_model_id UUID REFERENCES lora_models(id) ON DELETE SET NULL;

COMMENT ON COLUMN generations.groom_lora_model_id IS 'FK to lora_models for groom LoRA model';
COMMENT ON COLUMN generations.bride_lora_model_id IS 'FK to lora_models for bride LoRA model';

-- Create indexes for FK lookups
CREATE INDEX IF NOT EXISTS idx_generations_groom_lora_model_id
    ON generations(groom_lora_model_id)
    WHERE groom_lora_model_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generations_bride_lora_model_id
    ON generations(bride_lora_model_id)
    WHERE bride_lora_model_id IS NOT NULL;

-- ==========================================
-- 2. ADD INDEX ON LORA_MODELS.FAL_JOB_ID
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_lora_models_fal_job_id
    ON lora_models(fal_job_id)
    WHERE fal_job_id IS NOT NULL;

-- ==========================================
-- 3. MIGRATE EXISTING DATA (generations → lora_models)
-- ==========================================

-- 3a. Migrate groom LoRA data
INSERT INTO lora_models (project_id, user_id, role, fal_job_id, model_url, status, started_at, completed_at, created_at)
SELECT
    g.project_id,
    g.user_id,
    'groom',
    g.groom_fal_job_id,
    g.groom_lora_url,
    CASE
        WHEN g.groom_lora_url IS NOT NULL THEN 'completed'
        WHEN g.groom_fal_job_id IS NOT NULL THEN 'training'
        ELSE 'pending'
    END,
    g.started_at,
    g.training_completed_at,
    g.created_at
FROM generations g
WHERE g.groom_fal_job_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM lora_models lm
      WHERE lm.fal_job_id = g.groom_fal_job_id AND lm.role = 'groom'
  );

-- 3b. Migrate bride LoRA data
INSERT INTO lora_models (project_id, user_id, role, fal_job_id, model_url, status, started_at, completed_at, created_at)
SELECT
    g.project_id,
    g.user_id,
    'bride',
    g.bride_fal_job_id,
    g.bride_lora_url,
    CASE
        WHEN g.bride_lora_url IS NOT NULL THEN 'completed'
        WHEN g.bride_fal_job_id IS NOT NULL THEN 'training'
        ELSE 'pending'
    END,
    g.started_at,
    g.training_completed_at,
    g.created_at
FROM generations g
WHERE g.bride_fal_job_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM lora_models lm
      WHERE lm.fal_job_id = g.bride_fal_job_id AND lm.role = 'bride'
  );

-- ==========================================
-- 4. LINK GENERATIONS TO LORA_MODELS VIA FK
-- ==========================================

-- 4a. Link groom LoRA models
UPDATE generations g
SET groom_lora_model_id = lm.id
FROM lora_models lm
WHERE lm.fal_job_id = g.groom_fal_job_id
  AND lm.role = 'groom'
  AND g.groom_lora_model_id IS NULL;

-- 4b. Link bride LoRA models
UPDATE generations g
SET bride_lora_model_id = lm.id
FROM lora_models lm
WHERE lm.fal_job_id = g.bride_fal_job_id
  AND lm.role = 'bride'
  AND g.bride_lora_model_id IS NULL;

-- ==========================================
-- 5. VERIFICATION QUERY (for manual check)
-- ==========================================
-- Run this after migration to verify data integrity:
-- SELECT COUNT(*) FROM generations WHERE groom_fal_job_id IS NOT NULL AND groom_lora_model_id IS NULL;
-- SELECT COUNT(*) FROM generations WHERE bride_fal_job_id IS NOT NULL AND bride_lora_model_id IS NULL;
-- Both should return 0
