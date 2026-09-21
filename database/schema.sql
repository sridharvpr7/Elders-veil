-- ==========================================================================
-- ComicVerse PostgreSQL Relational Database Schema (database/schema.sql)
-- ==========================================================================

-- Drop existing tables if re-creating
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS reading_progress CASCADE;
DROP TABLE IF EXISTS reading_history CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS chapter_pages CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS comic_genres CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS comics CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'assets/images/avatars/default.svg',
    bio TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'locked')),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Comics Table
CREATE TABLE comics (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    author VARCHAR(100) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cover VARCHAR(255) NOT NULL,
    banner VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
    type VARCHAR(30) DEFAULT 'webcomic' CHECK (type IN ('webcomic', 'manhwa', 'webtoon', 'manga')),
    release_year INT DEFAULT 2026,
    rating NUMERIC(3,2) DEFAULT 4.50,
    views INT DEFAULT 0,
    chapter_count INT DEFAULT 0,
    latest_chapter VARCHAR(100) DEFAULT 'Chapter 1',
    is_featured BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Genres Table
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 4. Comic Genres Mapping Table (Many-to-Many)
CREATE TABLE comic_genres (
    comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (comic_id, genre_id)
);

-- 5. Chapters Table
CREATE TABLE chapters (
    id VARCHAR(64) PRIMARY KEY,
    comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    release_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_comic_chapter_num UNIQUE (comic_id, chapter_number)
);

-- 6. Chapter Pages Table
CREATE TABLE chapter_pages (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    CONSTRAINT unique_chapter_page UNIQUE (chapter_id, page_number)
);

-- 7. Favorites Table
CREATE TABLE favorites (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comic_id)
);

-- 8. Reading History Table
CREATE TABLE reading_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
    chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    page_number INT NOT NULL,
    total_pages INT NOT NULL,
    progress_percentage INT DEFAULT 0,
    last_read_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_comic_history UNIQUE (user_id, comic_id)
);

-- 9. Reading Progress Table
CREATE TABLE reading_progress (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
    chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    total_pages INT NOT NULL,
    progress_percentage INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comic_id)
);

-- 10. User Preferences Table
CREATE TABLE user_preferences (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    reader_mode VARCHAR(20) DEFAULT 'vertical',
    reader_width VARCHAR(20) DEFAULT 'fit-width',
    enable_animations BOOLEAN DEFAULT TRUE,
    auto_next_chapter BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Speed Optimization
CREATE INDEX idx_comics_status ON comics(status);
CREATE INDEX idx_comics_type ON comics(type);
CREATE INDEX idx_comics_rating ON comics(rating DESC);
CREATE INDEX idx_comics_views ON comics(views DESC);
CREATE INDEX idx_chapters_comic ON chapters(comic_id, chapter_number);
CREATE INDEX idx_history_user ON reading_history(user_id, last_read_time DESC);
