CREATE TABLE IF NOT EXISTS party_opinions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate TEXT NOT NULL,
  candidate_key TEXT NOT NULL,
  meeting TEXT NOT NULL,
  meeting_key TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  political TEXT NOT NULL,
  ethics TEXT NOT NULL,
  competence TEXT NOT NULL,
  relations TEXT NOT NULL,
  limitations TEXT NOT NULL,
  other TEXT NOT NULL DEFAULT '',
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (candidate_key, meeting_key, respondent_email)
);

CREATE INDEX IF NOT EXISTS idx_party_opinions_candidate_meeting
  ON party_opinions (meeting_key, candidate_key);
