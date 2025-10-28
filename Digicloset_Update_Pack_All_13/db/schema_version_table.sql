-- Create a manual schema version tracking table for tracking applied changes
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_tag TEXT NOT NULL,
  applied_by TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);
