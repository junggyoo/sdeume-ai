-- Migration: Migrate existing LoRA data to user_face_models
-- Version: 0008
-- Description: Populates user_face_models with existing completed LoRA models

-- ==========================================
-- Migrate existing completed LoRA models
-- ==========================================

-- For each user, select the most recent completed LoRA model per role
-- The migration uses lora_models table which has user_id, role, status, model_url

-- Insert groom LoRA models
INSERT INTO public.user_face_models (user_id, role, lora_model_id, is_active, created_at)
SELECT DISTINCT ON (lm.user_id)
    lm.user_id,
    'groom'::varchar,
    lm.id,
    true,
    lm.completed_at
FROM public.lora_models lm
WHERE lm.role = 'groom'
  AND lm.status = 'completed'
  AND lm.model_url IS NOT NULL
ORDER BY lm.user_id, lm.completed_at DESC NULLS LAST
ON CONFLICT DO NOTHING;

-- Insert bride LoRA models
INSERT INTO public.user_face_models (user_id, role, lora_model_id, is_active, created_at)
SELECT DISTINCT ON (lm.user_id)
    lm.user_id,
    'bride'::varchar,
    lm.id,
    true,
    lm.completed_at
FROM public.lora_models lm
WHERE lm.role = 'bride'
  AND lm.status = 'completed'
  AND lm.model_url IS NOT NULL
ORDER BY lm.user_id, lm.completed_at DESC NULLS LAST
ON CONFLICT DO NOTHING;

-- ==========================================
-- Verification query (run manually after migration)
-- ==========================================
-- SELECT
--     ufm.user_id,
--     ufm.role,
--     ufm.is_active,
--     lm.model_url,
--     lm.status as lora_status
-- FROM public.user_face_models ufm
-- LEFT JOIN public.lora_models lm ON ufm.lora_model_id = lm.id
-- ORDER BY ufm.user_id, ufm.role;
