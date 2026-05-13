-- Interview Prep Engine - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table: stores each job role the user is prepping for
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  company TEXT,
  job_description TEXT,
  resume_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study guides table: stores generated study guide content
CREATE TABLE IF NOT EXISTS study_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'default',
  role_overview TEXT,
  acronyms_cheat_sheet TEXT,
  top_questions JSONB,
  star_scenarios JSONB,
  study_30min TEXT,
  study_60min TEXT,
  full_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio library table: stores ElevenLabs generated MP3s
CREATE TABLE IF NOT EXISTS audio_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  study_guide_id UUID REFERENCES study_guides(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds INTEGER,
  voice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock interview sessions table
CREATE TABLE IF NOT EXISTS mock_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'default',
  questions JSONB,
  responses JSONB,
  grades JSONB,
  overall_score INTEGER,
  feedback TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id);
CREATE INDEX IF NOT EXISTS idx_study_guides_role_id ON study_guides(role_id);
CREATE INDEX IF NOT EXISTS idx_audio_library_role_id ON audio_library(role_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_role_id ON mock_sessions(role_id);

-- Row Level Security (optional - enable if using auth)
-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE study_guides ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audio_library ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;
