-- ============================================
-- System Settings Table
-- Stores key-value pairs for system configuration
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (no user access needed)
CREATE POLICY "Service role can manage settings" ON system_settings
    FOR ALL USING (true);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Default settings
INSERT INTO system_settings (key, value, description)
VALUES ('music_provider', 'suno', 'Active music generation provider: elevenlabs or suno')
ON CONFLICT (key) DO NOTHING;
