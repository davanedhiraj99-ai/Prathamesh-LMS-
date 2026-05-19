-- =====================================================
-- PRATHAMESH SIR LMS - COMPLETE DATABASE SCHEMA
-- Run this in your PostgreSQL database
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS batch_content CASCADE;
DROP TABLE IF EXISTS student_batches CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;

-- 1. STUDENTS TABLE (Admins & Students)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    ip_slot_1 VARCHAR(45),
    ip_slot_2 VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BATCHES/COURSES TABLE
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENT BATCHES (Enrollments)
CREATE TABLE student_batches (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, batch_id)
);

-- 4. BATCH CONTENT (Videos & Notes)
CREATE TABLE batch_content (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
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

-- 5. TESTIMONIALS
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    course VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User
-- Password: Admin@123 (bcrypt hashed)
INSERT INTO students (name, email, password, role) 
VALUES (
    'Admin User', 
    'admin@gmail.com', 
    '$2a$10$pbNePMqqkKjtRuYvBl31teC/mOeuc8ZKKOHeE.wMPgF66s90ZFQoy', 
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert Sample Data (Optional - for testing)
INSERT INTO batches (name, description) VALUES 
('JEE Physics 2024', 'Complete physics course for JEE Mains & Advanced'),
('NEET Biology 2024', 'Comprehensive biology for NEET preparation');

INSERT INTO testimonials (name, email, rating, review, course) VALUES 
('Rahul Sharma', 'rahul@example.com', 5, 'Excellent teaching methodology!', 'JEE Physics'),
('Priya Patel', 'priya@example.com', 5, 'Best online learning experience', 'NEET Biology');

-- Verify setup
SELECT 'Tables created successfully!' as status;
SELECT * FROM students WHERE role = 'admin';
