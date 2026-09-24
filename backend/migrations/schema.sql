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


-- Backward-compatible upgrades for existing Render databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE comics ADD COLUMN IF NOT EXISTS creator_id VARCHAR(64);
ALTER TABLE comics ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';
ALTER TABLE comics ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS review_note TEXT;

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
  new_comic_whatsapp BOOLEAN DEFAULT TRUE,
  new_chapter_whatsapp BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE
);

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


-- Elder's Veil v2 production features
ALTER TABLE comics ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_comics_schedule ON comics(scheduled_publish_at);
CREATE INDEX IF NOT EXISTS idx_chapters_schedule ON chapters(scheduled_publish_at);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'visible';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(64);

CREATE TABLE IF NOT EXISTS comment_likes (
  id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comment_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

CREATE TABLE IF NOT EXISTS creator_follows (
  id VARCHAR(120) PRIMARY KEY,
  follower_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, creator_id)
);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator ON creator_follows(creator_id);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(120) PRIMARY KEY,
  reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(100),
  reason VARCHAR(100) NOT NULL,
  details TEXT DEFAULT '',
  status VARCHAR(30) DEFAULT 'open',
  admin_note TEXT,
  resolved_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status,created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(120) PRIMARY KEY,
  actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  path TEXT,
  comic_id VARCHAR(64),
  chapter_id VARCHAR(64),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_comic ON analytics_events(comic_id,created_at DESC);

CREATE TABLE IF NOT EXISTS premium_payments (
  id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL,
  order_id VARCHAR(150) UNIQUE,
  payment_id VARCHAR(150),
  amount_paise INT NOT NULL,
  status VARCHAR(30) DEFAULT 'created',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_premium_payments_user ON premium_payments(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'open',
  admin_reply TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status,created_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(80) DEFAULT 'fa-trophy'
);
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(80) REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,achievement_id)
);

INSERT INTO achievements(id,name,description,icon) VALUES
('first_read','First Read','Read your first comic chapter.','fa-book-open'),
('ten_comics','10 Comics Read','Read from 10 different comics.','fa-layer-group'),
('streak_7','7 Day Reading Streak','Open the platform on seven consecutive days.','fa-fire'),
('first_rating','First Rating','Rate your first comic.','fa-star'),
('creator_start','Comic Writer','Become a Comic Writer.','fa-pen-nib')
ON CONFLICT (id) DO NOTHING;
