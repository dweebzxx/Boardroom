ALTER TABLE executive_briefs
  ADD COLUMN IF NOT EXISTS debate_id uuid REFERENCES debates(id) ON DELETE SET NULL;

ALTER TABLE executive_briefs
  ADD COLUMN IF NOT EXISTS content_markdown text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_executive_briefs_debate_id ON executive_briefs(debate_id);
