-- ============================================
-- SongForge Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE voice_status AS ENUM ('pending', 'processing', 'ready', 'failed');
CREATE TYPE song_status AS ENUM ('pending', 'generating_music', 'extracting_stems', 'converting_voice', 'merging', 'completed', 'failed');
CREATE TYPE song_mode AS ENUM ('ai_lyrics', 'collaborative', 'instrumental');
CREATE TYPE voice_mode AS ENUM ('single', 'duet', 'group', 'ai_default');
CREATE TYPE section_type AS ENUM ('verse1', 'verse2', 'chorus', 'bridge', 'all');
CREATE TYPE voice_layer AS ENUM ('lead', 'harmony', 'backing');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE credit_transaction_type AS ENUM ('subscription_grant', 'purchase', 'song_generation', 'refund', 'bonus', 'expiry');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    credits_balance INTEGER DEFAULT 3 CHECK (credits_balance >= 0), -- Start with 3 free credits
    stripe_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- ============================================
-- VOICE PROFILES TABLE
-- ============================================

CREATE TABLE voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    kitsai_voice_id VARCHAR(255), -- Kits.AI voice model ID
    sample_audio_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status voice_status DEFAULT 'pending',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user's voices
CREATE INDEX idx_voice_profiles_user ON voice_profiles(user_id);
CREATE INDEX idx_voice_profiles_status ON voice_profiles(status);

-- ============================================
-- STYLES TABLE
-- ============================================

CREATE TABLE styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    genre_tags TEXT[] NOT NULL DEFAULT '{}',
    example_audio_url TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active styles
CREATE INDEX idx_styles_active ON styles(is_active, category, sort_order);

-- ============================================
-- SONGS TABLE
-- ============================================

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    lyrics TEXT,
    style_id UUID REFERENCES styles(id),
    prompt TEXT,
    song_mode song_mode NOT NULL,
    voice_mode voice_mode DEFAULT 'ai_default',
    genre VARCHAR(100),
    mood VARCHAR(100),
    language VARCHAR(100),
    audio_url TEXT,
    instrumental_url TEXT,
    original_vocals_url TEXT,
    duration_seconds INTEGER,
    cost_credits INTEGER DEFAULT 1,
    status song_status DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing databases:
-- ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre VARCHAR(100);
-- ALTER TABLE songs ADD COLUMN IF NOT EXISTS mood VARCHAR(100);
-- ALTER TABLE songs ADD COLUMN IF NOT EXISTS language VARCHAR(100);

-- Indexes
CREATE INDEX idx_songs_user ON songs(user_id);
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_created ON songs(created_at DESC);
CREATE INDEX idx_songs_public ON songs(is_public) WHERE is_public = TRUE;

-- ============================================
-- SONG VOICE ASSIGNMENTS TABLE
-- For multi-voice songs (duets, groups)
-- ============================================

CREATE TABLE song_voice_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    voice_profile_id UUID NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
    section_type section_type NOT NULL,
    layer voice_layer DEFAULT 'lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for song assignments
CREATE INDEX idx_song_voice_assignments_song ON song_voice_assignments(song_id);

-- ============================================
-- PLANS TABLE
-- ============================================

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    credits_per_month INTEGER NOT NULL,
    price_monthly_cents INTEGER NOT NULL,
    price_yearly_cents INTEGER,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    max_voice_profiles INTEGER DEFAULT 0,
    can_duet BOOLEAN DEFAULT FALSE,
    can_group BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- Ledger for all credit operations
-- ============================================

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = credit, negative = debit
    balance_after INTEGER NOT NULL,
    type credit_transaction_type NOT NULL,
    description TEXT,
    song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user transactions
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_voice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Voice profiles policies
CREATE POLICY "Users can view own voices" ON voice_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voices" ON voice_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voices" ON voice_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voices" ON voice_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Songs policies
CREATE POLICY "Users can view own songs" ON songs
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create own songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs" ON songs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs" ON songs
    FOR DELETE USING (auth.uid() = user_id);

-- Song voice assignments policies
CREATE POLICY "Users can view own song assignments" ON song_voice_assignments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM songs WHERE songs.id = song_voice_assignments.song_id AND songs.user_id = auth.uid())
    );

CREATE POLICY "Users can create own song assignments" ON song_voice_assignments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM songs WHERE songs.id = song_voice_assignments.song_id AND songs.user_id = auth.uid())
    );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Styles policies (public read)
CREATE POLICY "Anyone can view active styles" ON styles
    FOR SELECT USING (is_active = TRUE);

-- Plans policies (public read)
CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (is_active = TRUE);

-- ============================================
-- SEED DATA: DEFAULT PLANS
-- ============================================

INSERT INTO plans (name, slug, description, credits_per_month, price_monthly_cents, price_yearly_cents, max_voice_profiles, can_duet, can_group, features, sort_order) VALUES
('Free', 'free', 'Get started with 3 free credits', 3, 0, NULL, 0, FALSE, FALSE, '["3 credits/month", "AI vocals only", "Standard quality"]', 0),
('Starter', 'starter', 'Perfect for casual creators', 20, 999, 9590, 1, FALSE, FALSE, '["20 credits/month", "1 voice clone", "High quality", "No watermark"]', 1),
('Creator', 'creator', 'For serious music makers', 60, 2499, 23990, 3, TRUE, FALSE, '["60 credits/month", "3 voice clones", "Duet mode", "Priority queue"]', 2),
('Pro', 'pro', 'Unlimited creativity', 150, 4999, 47990, 999, TRUE, TRUE, '["150 credits/month", "Unlimited voices", "Group/choir mode", "API access", "Commercial license"]', 3);

-- ============================================
-- SEED DATA: DEFAULT STYLES
-- ============================================

INSERT INTO styles (name, category, description, genre_tags, is_premium, sort_order) VALUES
-- Pop
('Modern Pop', 'Pop', 'Contemporary pop with catchy hooks', ARRAY['pop', 'modern', 'catchy'], FALSE, 1),
('Dance Pop', 'Pop', 'Upbeat dance-oriented pop', ARRAY['pop', 'dance', 'upbeat', 'electronic'], FALSE, 2),
('Indie Pop', 'Pop', 'Alternative indie pop sound', ARRAY['indie', 'pop', 'alternative'], FALSE, 3),
('K-Pop', 'Pop', 'Korean pop style', ARRAY['kpop', 'korean', 'pop', 'energetic'], TRUE, 4),

-- Rock
('Classic Rock', 'Rock', 'Timeless rock sound', ARRAY['rock', 'classic', 'guitar'], FALSE, 10),
('Alternative Rock', 'Rock', 'Modern alternative rock', ARRAY['rock', 'alternative', 'indie'], FALSE, 11),
('Hard Rock', 'Rock', 'Heavy guitar-driven rock', ARRAY['rock', 'hard', 'heavy', 'guitar'], FALSE, 12),
('Punk Rock', 'Rock', 'Fast-paced punk energy', ARRAY['punk', 'rock', 'fast', 'energetic'], TRUE, 13),

-- Hip-Hop
('Trap', 'Hip-Hop', 'Modern trap beats', ARRAY['trap', 'hiphop', 'beat', 'bass'], FALSE, 20),
('Boom Bap', 'Hip-Hop', 'Classic hip-hop style', ARRAY['hiphop', 'boombap', 'classic', 'sample'], FALSE, 21),
('Lo-Fi Hip-Hop', 'Hip-Hop', 'Chill lo-fi beats', ARRAY['lofi', 'hiphop', 'chill', 'relaxing'], FALSE, 22),

-- Electronic
('House', 'Electronic', 'Classic house music', ARRAY['house', 'electronic', 'dance', 'club'], FALSE, 30),
('Techno', 'Electronic', 'Dark techno beats', ARRAY['techno', 'electronic', 'dark', 'club'], TRUE, 31),
('EDM', 'Electronic', 'Festival EDM sound', ARRAY['edm', 'electronic', 'festival', 'drop'], FALSE, 32),
('Synthwave', 'Electronic', '80s-inspired synths', ARRAY['synthwave', 'retro', '80s', 'synth'], TRUE, 33),

-- R&B/Soul
('Contemporary R&B', 'R&B', 'Modern R&B vibes', ARRAY['rnb', 'soul', 'contemporary', 'smooth'], FALSE, 40),
('Neo Soul', 'R&B', 'Soulful and jazzy', ARRAY['neosoul', 'soul', 'jazz', 'smooth'], TRUE, 41),

-- Other
('Acoustic', 'Other', 'Simple acoustic sound', ARRAY['acoustic', 'guitar', 'simple', 'folk'], FALSE, 50),
('Jazz', 'Other', 'Smooth jazz style', ARRAY['jazz', 'smooth', 'instrumental'], TRUE, 51),
('Country', 'Other', 'Modern country music', ARRAY['country', 'guitar', 'americana'], FALSE, 52),
('Reggae', 'Other', 'Laid-back reggae vibes', ARRAY['reggae', 'caribbean', 'relaxed'], FALSE, 53);
