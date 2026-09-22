-- ComicVerse / Elder's Veil Database Schema (PostgreSQL Compatible)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  phone VARCHAR(25),
  is_premium BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comics (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  author VARCHAR(100),
  artist VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ongoing',
  type VARCHAR(30) DEFAULT 'manga',
  cover_image TEXT,
  banner_image TEXT,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  views BIGINT DEFAULT 0,
  release_year INT DEFAULT 2026,
  language VARCHAR(50) DEFAULT 'English',
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  publish_status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS genres (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS comic_genres (
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  genre_id VARCHAR(64) REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, genre_id)
);

CREATE TABLE IF NOT EXISTS chapters (
  id VARCHAR(64) PRIMARY KEY,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  chapter_number NUMERIC(6, 2) NOT NULL,
  title VARCHAR(255),
  release_date DATE DEFAULT CURRENT_DATE,
  views BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comic_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS chapter_pages (
  id VARCHAR(64) PRIMARY KEY,
  chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  UNIQUE(chapter_id, page_number)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comic_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comic_id)
);

CREATE TABLE IF NOT EXISTS reading_history (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comic_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Backward-compatible upgrades for existing Render databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE comics ADD COLUMN IF NOT EXISTS creator_id VARCHAR(64);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';

-- Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_comics_slug ON comics(slug);
CREATE INDEX IF NOT EXISTS idx_comics_rating ON comics(rating DESC);
CREATE INDEX IF NOT EXISTS idx_comics_views ON comics(views DESC);
CREATE INDEX IF NOT EXISTS idx_comics_creator ON comics(creator_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter ON chapter_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
