const User = require('../src/models/User');
const Comic = require('../src/models/Comic');
const Chapter = require('../src/models/Chapter');
const Genre = require('../src/models/Genre');
const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function seedInitialData() {
  try {
    console.log('[Seed] Seeding initial database data...');

    // Seed Admin & Default User
    let admin = await User.findByEmail('admin@comicverse.com');
    if (!admin) {
      admin = await User.create({
        id: 'user-admin-01',
        username: 'AdminVerse',
        email: 'admin@comicverse.com',
        password: 'AdminPass123!',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      });
      console.log('[Seed] Admin user created: admin@comicverse.com / AdminPass123!');
    }

    const userExists = await User.findByEmail('user@comicverse.com');
    if (!userExists) {
      await User.create({
        id: 'user-reader-01',
        username: 'ShadowReader',
        email: 'user@comicverse.com',
        password: 'UserPass123!',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      });
      console.log('[Seed] Reader user created: user@comicverse.com / UserPass123!');
    }

    // Seed Genres
    const genreNames = ['Action', 'Adventure', 'Fantasy', 'Sci-Fi', 'Cyberpunk', 'Mystery', 'Romance', 'Supernatural'];
    for (const name of genreNames) {
      await Genre.create({ id: `genre-${name.toLowerCase()}`, name });
    }

    // No sample comics are seeded. Only approved admin/creator uploads populate the catalog.

    // Save backup JSON in frontend/data/comics.json
    const backupComics = await Comic.getAll({ limit: 100 });
    const fullBackup = [];
    for (const c of backupComics) {
      const chs = await Chapter.getByComicId(c.id);
      const detailedChs = [];
      for (const ch of chs) {
        detailedChs.push(await Chapter.findById(ch.id));
      }
      fullBackup.push({ ...c, chapters: detailedChs });
    }

    const dataJsonPath = path.join(__dirname, '../../frontend/data/comics.json');
    const dataDir = path.dirname(dataJsonPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataJsonPath, JSON.stringify(fullBackup, null, 2), 'utf8');
    console.log('[Seed] Wrote seed dataset to frontend/data/comics.json');

  } catch (err) {
    console.error('[Seed] Error seeding initial data:', err.message);
  }
}

module.exports = {
  seedInitialData
};
