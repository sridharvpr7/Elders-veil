-- ComicVerse / Elder's Veil Database Schema (PostgreSQL Compatible)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  phone VARCHAR(25),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  account_status VARCHAR(20) DEFAULT 'active',
  avatar TEXT,
  email_verified BOOLEAN DEFAULT TRUE,
  otp_hash VARCHAR(255),
  otp_expiry TIMESTAMP WITH TIME ZONE,
  otp_attempts INT DEFAULT 0,
  reset_otp_hash VARCHAR(255),
  reset_otp_expiry TIMESTAMP WITH TIME ZONE,
  reset_otp_attempts INT DEFAULT 0,
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
  review_note TEXT,
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
  publish_status VARCHAR(20) DEFAULT 'published',
  review_note TEXT,
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


ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_request_note TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_approved_by VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

ALTER TABLE comics ADD COLUMN IF NOT EXISTS creator_id VARCHAR(64);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';
ALTER TABLE comics ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE comics ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE TABLE IF NOT EXISTS premium_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  request_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(64),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_premium_requests_user ON premium_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_requests_status ON premium_requests(status);

-- Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_comics_slug ON comics(slug);
CREATE INDEX IF NOT EXISTS idx_comics_rating ON comics(rating DESC);
CREATE INDEX IF NOT EXISTS idx_comics_views ON comics(views DESC);
CREATE INDEX IF NOT EXISTS idx_comics_creator ON comics(creator_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_premium_expires ON users(premium_expires_at);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter ON chapter_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);

CREATE INDEX IF NOT EXISTS idx_comics_publish_status ON comics(publish_status);
CREATE INDEX IF NOT EXISTS idx_chapters_publish_status ON chapters(publish_status);
CREATE INDEX IF NOT EXISTS idx_chapters_views ON chapters(views DESC);
CREATE INDEX IF NOT EXISTS idx_reading_history_updated ON reading_history(updated_at DESC);


CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  new_comic_email BOOLEAN DEFAULT TRUE,
  new_chapter_email BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE
);
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_comic_email BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_chapter_email BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS comic_likes (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,comic_id)
);
CREATE TABLE IF NOT EXISTS comic_follows (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,comic_id)
);
CREATE TABLE IF NOT EXISTS ratings (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL CHECK(rating>=1 AND rating<=5),
  review TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,comic_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_comic ON comments(comic_id,created_at DESC);
