CREATE TABLE IF NOT EXISTS sentiment_snapshots (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  narrative_health   integer     NOT NULL CHECK (narrative_health BETWEEN 0 AND 100),
  favorable_count    integer     NOT NULL DEFAULT 0,
  hostile_count      integer     NOT NULL DEFAULT 0,
  news_cycle_temp    text        NOT NULL CHECK (news_cycle_temp IN ('Low','Moderate','High','Critical')),
  issue_areas        jsonb       NOT NULL DEFAULT '[]',
  sentiment_trend    jsonb       NOT NULL DEFAULT '{}',
  audience_readiness jsonb       NOT NULL DEFAULT '{}',
  signals            jsonb       NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created_at
  ON sentiment_snapshots (created_at DESC);

ALTER TABLE sentiment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON sentiment_snapshots
  FOR SELECT USING (true);
