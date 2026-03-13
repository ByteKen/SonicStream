-- ============================================================
-- Spotify Clone — Supabase Postgres Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);


-- 2. Search Cache
CREATE TABLE IF NOT EXISTS search_cache (
    query TEXT PRIMARY KEY,
    results JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed — accessed only by the backend service role
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on search_cache"
    ON search_cache FOR ALL
    USING (true)
    WITH CHECK (true);


-- 3. Stream Log
CREATE TABLE IF NOT EXISTS stream_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    title TEXT,
    codec TEXT,
    duration_seconds INTEGER,
    requested_at TIMESTAMPTZ DEFAULT now(),
    client_ip TEXT
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_stream_log_video_id ON stream_log(video_id);
CREATE INDEX IF NOT EXISTS idx_stream_log_requested_at ON stream_log(requested_at DESC);

ALTER TABLE stream_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on stream_log"
    ON stream_log FOR ALL
    USING (true)
    WITH CHECK (true);
