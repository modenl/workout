CREATE TABLE IF NOT EXISTS visits (
  ts INTEGER NOT NULL,      -- ms since epoch
  visitor TEXT NOT NULL,    -- daily salted hash, unique per person per UTC day
  ip TEXT,                  -- truncated
  country TEXT, region TEXT, city TEXT,
  ref TEXT,                 -- referring site (host only) or ?ref= / utm_source
  browser TEXT, os TEXT, device TEXT, lang TEXT,
  bot INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS visits_ts ON visits (ts);
CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, value TEXT NOT NULL);
