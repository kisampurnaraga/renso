CREATE TABLE IF NOT EXISTS agent_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team text NOT NULL CHECK (team IN ('backend','experience','audio','visual','scanner','qa','marketing','community')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  instructions text NOT NULL CHECK (char_length(instructions) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','dispatching','dispatched','running','review_ready','failed','dispatch_failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  run_url text,
  pr_url text,
  error text
);
