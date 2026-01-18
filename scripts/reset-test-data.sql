-- ============================================
-- Reset Test Data for Sdeume AI
-- ============================================
-- 외래 키 순서에 따라 데이터 삭제
-- Supabase Dashboard > SQL Editor 에서 실행

-- 1. retouches (images 참조)
DELETE FROM public.retouches;

-- 2. images (generations, projects 참조)
DELETE FROM public.images;

-- 3. videos (projects 참조)
DELETE FROM public.videos;

-- 4. generations (projects 참조)
DELETE FROM public.generations;

-- 5. lora_models (projects 참조)
DELETE FROM public.lora_models;

-- 6. uploads (projects 참조)
DELETE FROM public.uploads;

-- 7. entitlements (projects 참조)
DELETE FROM public.entitlements;

-- 8. payments (projects 참조)
DELETE FROM public.payments;

-- 9. projects (마지막)
DELETE FROM public.projects;

-- Storage 파일도 삭제 필요 (Dashboard > Storage 에서 수동 삭제)
-- - uploads 버킷의 모든 파일
-- - generated 버킷의 모든 파일

SELECT 'Data reset complete!' as message;
