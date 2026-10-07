BEGIN;
CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY,
  token_hash char(64) UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS guest_sessions_expiry ON guest_sessions(expires_at);
CREATE TABLE IF NOT EXISTS daily_usage (
  session_id uuid REFERENCES guest_sessions(id) ON DELETE CASCADE,
  day date NOT NULL,
  requests integer NOT NULL DEFAULT 0 CHECK(requests>=0),
  PRIMARY KEY(session_id,day)
);
COMMIT;
