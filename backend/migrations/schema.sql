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

-- Creator follow system: users can follow creators and see follower/following lists
CREATE TABLE IF NOT EXISTS creator_follows (
  id VARCHAR(100) PRIMARY KEY,
  follower_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, creator_id),
  CHECK (follower_id <> creator_id)
);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator ON creator_follows(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_follows_follower ON creator_follows(follower_id, created_at DESC);



-- ============================================================
-- Elder's Veil Platform Expansion (Phase 1-3 + Advanced)
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE TABLE IF NOT EXISTS reading_lists (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reading_list_items (
  id VARCHAR(100) PRIMARY KEY,
  list_id VARCHAR(100) REFERENCES reading_lists(id) ON DELETE CASCADE,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, comic_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_lists_user ON reading_lists(user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS reading_streaks (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_read_date DATE,
  total_read_days INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) DEFAULT 'fa-award',
  points INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,achievement_id)
);

CREATE TABLE IF NOT EXISTS reader_preferences (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reading_mode VARCHAR(30) DEFAULT 'vertical',
  fit_mode VARCHAR(30) DEFAULT 'width',
  image_quality VARCHAR(20) DEFAULT 'high',
  auto_scroll BOOLEAN DEFAULT FALSE,
  auto_scroll_speed INT DEFAULT 2,
  show_progress BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment_likes (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  comment_id VARCHAR(100) REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,comment_id)
);

CREATE TABLE IF NOT EXISTS offline_downloads (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,chapter_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64),
  event_type VARCHAR(100) NOT NULL,
  path TEXT DEFAULT '',
  comic_id VARCHAR(64),
  chapter_id VARCHAR(64),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  actor_id VARCHAR(64),
  action VARCHAR(150) NOT NULL,
  target_type VARCHAR(80) DEFAULT '',
  target_id VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(100) PRIMARY KEY,
  reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id VARCHAR(100),
  reason VARCHAR(100) NOT NULL,
  details TEXT DEFAULT '',
  status VARCHAR(30) DEFAULT 'open',
  admin_note TEXT DEFAULT '',
  resolved_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_id VARCHAR(100),
  device_name VARCHAR(200) DEFAULT 'Unknown device',
  user_agent TEXT DEFAULT '',
  ip_hash TEXT DEFAULT '',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'created',
  provider VARCHAR(50) DEFAULT 'razorpay',
  provider_order_id VARCHAR(150),
  provider_payment_id VARCHAR(150),
  amount_paise INT DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS creator_tips (
  id VARCHAR(100) PRIMARY KEY,
  sender_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  creator_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  amount_paise INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  provider VARCHAR(50) DEFAULT 'razorpay',
  provider_payment_id VARCHAR(150),
  status VARCHAR(30) DEFAULT 'pending',
  message TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_earnings (
  creator_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_tips_paise BIGINT DEFAULT 0,
  total_subscription_paise BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_banners (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS editor_picks (
  id VARCHAR(100) PRIMARY KEY,
  comic_id VARCHAR(64) REFERENCES comics(id) ON DELETE CASCADE,
  note TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comic_id)
);

CREATE TABLE IF NOT EXISTS story_universes (
  id VARCHAR(100) PRIMARY KEY,
  comic_id VARCHAR(64) UNIQUE REFERENCES comics(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS story_characters (
  id VARCHAR(100) PRIMARY KEY,
  universe_id VARCHAR(100) REFERENCES story_universes(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(100) DEFAULT '',
  age VARCHAR(30) DEFAULT '',
  bio TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS story_locations (
  id VARCHAR(100) PRIMARY KEY,
  universe_id VARCHAR(100) REFERENCES story_universes(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS story_events (
  id VARCHAR(100) PRIMARY KEY,
  universe_id VARCHAR(100) REFERENCES story_universes(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS story_relations (
  id VARCHAR(100) PRIMARY KEY,
  universe_id VARCHAR(100) REFERENCES story_universes(id) ON DELETE CASCADE,
  from_character_id VARCHAR(100) REFERENCES story_characters(id) ON DELETE CASCADE,
  to_character_id VARCHAR(100) REFERENCES story_characters(id) ON DELETE CASCADE,
  relation_type VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS chapter_recaps (
  chapter_id VARCHAR(64) PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
  recap TEXT NOT NULL,
  generated_by VARCHAR(30) DEFAULT 'admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chapter_audio (
  chapter_id VARCHAR(64) PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INT DEFAULT 0,
  voice_name VARCHAR(120) DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chapter_motion (
  chapter_id VARCHAR(64) PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
  manifest JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interactive_stories (
  id VARCHAR(100) PRIMARY KEY,
  chapter_id VARCHAR(64) UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  intro TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS interactive_choices (
  id VARCHAR(100) PRIMARY KEY,
  story_id VARCHAR(100) REFERENCES interactive_stories(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  next_chapter_id VARCHAR(64) REFERENCES chapters(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0
);

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_follower_email BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS comment_email BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS achievement_email BOOLEAN DEFAULT FALSE;

INSERT INTO achievements(id,code,name,description,icon,points) VALUES
('ach-first-read','first_read','First Page','Read your first chapter.','fa-book-open',10),
('ach-streak-3','streak_3','Three Day Streak','Read on three consecutive days.','fa-fire',30),
('ach-streak-7','streak_7','Week Warrior','Read on seven consecutive days.','fa-fire-flame-curved',70),
('ach-chapters-10','chapters_10','Chapter Hunter','Read ten chapters.','fa-layer-group',50),
('ach-follow-5','follow_5','Supporter','Follow five creators.','fa-user-plus',40)
ON CONFLICT(code) DO NOTHING;
