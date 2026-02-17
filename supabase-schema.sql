-- ============================================
-- Skillmela Broadcast Platform - Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  admin_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT DEFAULT 'instructor' CHECK (sender_role = 'instructor'),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Set REPLICA IDENTITY FULL so realtime DELETE events include all columns (needed for filters)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 4. Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 5. Create storage bucket for broadcast files
INSERT INTO storage.buckets (id, name, public)
VALUES ('broadcast-files', 'broadcast-files', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies - allow anyone to upload/read/delete from the bucket
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'broadcast-files');

CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'broadcast-files');

CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'broadcast-files');

-- 7. RLS policies for broadcasts (allow all operations via anon key)
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read broadcasts" ON broadcasts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert broadcasts" ON broadcasts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete broadcasts" ON broadcasts
  FOR DELETE USING (true);

-- 8. RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update messages" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete messages" ON messages
  FOR DELETE USING (true);

-- 9. Index on broadcast code for fast lookups
CREATE INDEX IF NOT EXISTS idx_broadcasts_code ON broadcasts(code);
CREATE INDEX IF NOT EXISTS idx_messages_broadcast_id ON messages(broadcast_id);
