-- =============================================================================
-- Add async polling columns to admin_prompt_tests
-- Supports: queued → generating → completed / failed status flow
-- =============================================================================

ALTER TABLE admin_prompt_tests
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed',
  ADD COLUMN progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN total_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN error_message TEXT;

-- Index for active job lookups
CREATE INDEX idx_admin_prompt_tests_status
  ON admin_prompt_tests(status)
  WHERE status IN ('queued', 'generating');

COMMENT ON COLUMN admin_prompt_tests.status IS 'Job status: queued, generating, completed, failed';
COMMENT ON COLUMN admin_prompt_tests.progress IS 'Number of images generated so far';
COMMENT ON COLUMN admin_prompt_tests.total_count IS 'Total number of images requested';
COMMENT ON COLUMN admin_prompt_tests.error_message IS 'Error message when status is failed';
