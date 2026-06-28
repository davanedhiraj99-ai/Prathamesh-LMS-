-- Add production-safe device/session auth tables without dropping existing data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    fingerprint_hash VARCHAR(128),
    user_agent TEXT,
    last_ip VARCHAR(45),
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP,
    UNIQUE (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_family UUID NOT NULL DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    last_ip VARCHAR(45),
    fingerprint_hash VARCHAR(128),
    revoked_at TIMESTAMP,
    revoke_reason VARCHAR(255),
    is_current BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_device_id ON refresh_sessions(device_id);

ALTER TABLE students DROP COLUMN IF EXISTS ip_slot_1;
ALTER TABLE students DROP COLUMN IF EXISTS ip_slot_2;