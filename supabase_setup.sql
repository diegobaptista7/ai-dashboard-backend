-- Run these commands in your Supabase SQL Editor to enable the Access Control and Logging features.

-- 1. Create Dashboard Configuration Table
CREATE TABLE IF NOT EXISTS dashboard_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default values (Password is initially disabled)
INSERT INTO dashboard_config (key, value)
VALUES 
  ('password_enabled', 'false'),
  ('dashboard_password', 'tutator2026')
ON CONFLICT (key) DO NOTHING;

-- 2. Create Access Logs Table
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Security (Enable RLS or allow anon access for MVP)
-- For this private dashboard, we allow anon inserts and selects 
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read dashboard_config" ON dashboard_config FOR SELECT USING (true);
CREATE POLICY "Allow anon update dashboard_config" ON dashboard_config FOR ALL USING (true);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert access_logs" ON access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access_logs" ON access_logs FOR SELECT USING (true);
