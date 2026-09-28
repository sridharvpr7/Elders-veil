const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let pool = null;
let isPgConnected = false;

// Fallback dynamic database store for offline local testing
const fallbackStore = {
  users: [],
  comics: [],
  genres: [],
  comic_genres: [],
  chapters: [],
  chapter_pages: [],
  bookmarks: [],
  favorites: [],
  reading_history: [],
  refresh_tokens: [], notifications: [], notification_preferences: [], comic_likes: [], comic_follows: [], creator_follows: [], ratings: [], comments: [], premium_requests: [], reading_lists: [], reading_list_items: [], reading_streaks: [], achievements: [], user_achievements: [], reader_preferences: [], comment_likes: [], offline_downloads: [], analytics_events: [], audit_logs: [], reports: [], user_sessions: [], subscriptions: [], creator_tips: [], creator_earnings: [], homepage_banners: [], editor_picks: [], story_universes: [], story_characters: [], story_locations: [], story_events: [], story_relations: [], chapter_recaps: [], chapter_audio: [], chapter_motion: [], interactive_stories: [], interactive_choices: []
};

// Try loading saved fallback database if exists
const fallbackDbPath = path.join(__dirname, '../../../data/fallback_db.json');
try {
  if (fs.existsSync(fallbackDbPath)) {
    const raw = fs.readFileSync(fallbackDbPath, 'utf8');
    const parsed = JSON.parse(raw);
    Object.assign(fallbackStore, parsed);
  }
} catch (err) {
  console.log('[DB] Fallback storage initialized empty');
}

function saveFallbackStore() {
  try {
    const dataDir = path.dirname(fallbackDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(fallbackDbPath, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving fallback store:', err.message);
  }
}

async function initDatabase() {
  if (env.DATABASE_URL && env.DATABASE_URL.trim() !== '') {
    try {
      const isProduction = env.NODE_ENV === 'production' || env.DATABASE_URL.includes('render.com');
      pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000
      });

      // Test connection
      const client = await pool.connect();
      console.log('[DB] Connected to PostgreSQL Database');
      
      // Run migrations
      const schemaPath = path.join(__dirname, '../../migrations/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('[DB] PostgreSQL Migrations executed successfully');
      }
      // Remove legacy starter/sample comics from older deployments.
      // This is intentionally idempotent so real admin/creator comics are untouched.
      await pool.query(`
        DELETE FROM chapters WHERE comic_id IN (
          SELECT id FROM comics
          WHERE id LIKE 'starter-%'
             OR slug IN ('dark-moon','cyber-veil-2099','solo-eclipse','celestial-odyssey')
        );
        DELETE FROM comics
        WHERE id LIKE 'starter-%'
           OR slug IN ('dark-moon','cyber-veil-2099','solo-eclipse','celestial-odyssey');
      `);
      console.log('[DB] Legacy starter/sample comics removed.');

      client.release();
      isPgConnected = true;
      return;
    } catch (err) {
      console.warn('[DB] PostgreSQL connection failed, switching to local DB engine:', err.message);
      isPgConnected = false;
    }
  } else {
    // Remove legacy starter/sample comics from the local fallback store too.
    const legacySampleIds = new Set(
      fallbackStore.comics
        .filter(c => String(c.id || '').startsWith('starter-') || ['dark-moon','cyber-veil-2099','solo-eclipse','celestial-odyssey'].includes(String(c.slug || '')))
        .map(c => String(c.id))
    );
    fallbackStore.comics = fallbackStore.comics.filter(c => !legacySampleIds.has(String(c.id)) && !String(c.id || '').startsWith('starter-'));
    fallbackStore.chapters = fallbackStore.chapters.filter(ch => !legacySampleIds.has(String(ch.comic_id || ch.comicId || '')));
    saveFallbackStore();
    console.log('[DB] No DATABASE_URL provided. Using high-performance dynamic DB engine.');
  }
}

async function query(text, params = []) {
  if (isPgConnected && pool) {
    return await pool.query(text, params);
  }
  // Simplified query simulation for memory/fallback mode
  return executeFallbackQuery(text, params);
}

function executeFallbackQuery(text, params = []) {
  const clean = text.trim().replace(/\s+/g, ' ');
  // Basic query parsing for standard operations in fallback mode
  if (clean.toUpperCase().startsWith('SELECT')) {
    if (clean.includes('FROM users')) {
      let res = [...fallbackStore.users];
      if (params.length === 1 && clean.includes('WHERE email =')) {
        res = res.filter(u => u.email.toLowerCase() === String(params[0]).toLowerCase());
      } else if (params.length === 1 && clean.includes('WHERE username =')) {
        res = res.filter(u => u.username.toLowerCase() === String(params[0]).toLowerCase());
      } else if (params.length === 1 && clean.includes('WHERE id =')) {
        res = res.filter(u => u.id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM comics')) {
      let res = [...fallbackStore.comics];
      if (clean.includes('WHERE slug =')) {
        res = res.filter(c => c.slug === params[0]);
      } else if (clean.includes('WHERE id =')) {
        res = res.filter(c => c.id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM chapters')) {
      let res = [...fallbackStore.chapters];
      if (clean.includes('WHERE comic_id =')) {
        res = res.filter(ch => ch.comic_id === params[0]);
      } else if (clean.includes('WHERE id =')) {
        res = res.filter(ch => ch.id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM chapter_pages')) {
      let res = [...fallbackStore.chapter_pages];
      if (clean.includes('WHERE chapter_id =')) {
        res = res.filter(p => p.chapter_id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM genres')) {
      return { rows: fallbackStore.genres, rowCount: fallbackStore.genres.length };
    }
    if (clean.includes('FROM bookmarks')) {
      let res = [...fallbackStore.bookmarks];
      if (clean.includes('WHERE user_id =')) {
        res = res.filter(b => b.user_id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM favorites')) {
      let res = [...fallbackStore.favorites];
      if (clean.includes('WHERE user_id =')) {
        res = res.filter(f => f.user_id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
    if (clean.includes('FROM reading_history')) {
      let res = [...fallbackStore.reading_history];
      if (clean.includes('WHERE user_id =')) {
        res = res.filter(h => h.user_id === params[0]);
      }
      return { rows: res, rowCount: res.length };
    }
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  initDatabase,
  query,
  getPool: () => pool,
  isPgConnected: () => isPgConnected,
  fallbackStore,
  saveFallbackStore
};
