-- =====================================================
-- PRATHAMESH SIR LMS - COMPLETE DATABASE SCHEMA
-- Run this in your PostgreSQL database
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS refresh_sessions CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS batch_content CASCADE;
DROP TABLE IF EXISTS student_batches CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_devices (
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

CREATE TABLE refresh_sessions (
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

CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_batches (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, batch_id)
);

CREATE TABLE batch_content (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    sort_order INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'note')),
    url TEXT NOT NULL,
    file_size INTEGER,
    duration INTEGER,
    thumbnail TEXT,
    status VARCHAR(50) DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    course VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_refresh_sessions_user_id ON refresh_sessions(user_id);
CREATE INDEX idx_refresh_sessions_device_id ON refresh_sessions(device_id);

INSERT INTO students (name, email, password, role)
VALUES (
    'Admin User',
    'admin@gmail.com',
    '$2a$10$pbNePMqqkKjtRuYvBl31teC/mOeuc8ZKKOHeE.wMPgF66s90ZFQoy',
    'admin'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO batches (name, description) VALUES
('JEE Physics 2024', 'Complete physics course for JEE Mains & Advanced'),
('NEET Biology 2024', 'Comprehensive biology for NEET preparation');

INSERT INTO testimonials (name, email, rating, review, course) VALUES
('Rahul Sharma', 'rahul@example.com', 5, 'Excellent teaching methodology!', 'JEE Physics'),
('Priya Patel', 'priya@example.com', 5, 'Best online learning experience', 'NEET Biology');

SELECT 'Tables created successfully!' AS status;
SELECT id, name, email, role FROM students WHERE role = 'admin';
