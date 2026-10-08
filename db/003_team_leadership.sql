ALTER TABLE agent_jobs
  DROP CONSTRAINT IF EXISTS agent_jobs_team_check,
  ADD CONSTRAINT agent_jobs_team_check CHECK (team IN ('architect','backend','experience','audio','visual','scanner','qa','marketing','research','community'));
