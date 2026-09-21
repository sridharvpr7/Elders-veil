const User = require('../src/models/User');
const Comic = require('../src/models/Comic');
const Chapter = require('../src/models/Chapter');
const Genre = require('../src/models/Genre');
const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

function generateSvgComicPage(title, chapterNum, pageNum, bgGradient) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}"/>
        <stop offset="100%" stop-color="${bgGradient[1]}"/>
      </linearGradient>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1200" fill="url(#bg)"/>
    <rect x="40" y="40" width="720" height="1120" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
    
    <!-- Manga Frame Panels -->
    <rect x="60" y="80" width="680" height="320" rx="12" fill="url(#cardBg)" stroke="rgba(124,58,237,0.4)" stroke-width="2"/>
    <text x="400" y="240" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#e2e8f0" text-anchor="middle" letter-spacing="2">
      ${title.toUpperCase()}
    </text>
    <text x="400" y="280" font-family="Arial, sans-serif" font-weight="600" font-size="18" fill="#94a3b8" text-anchor="middle">
      CHAPTER ${chapterNum} — PANEL 1
    </text>
    
    <!-- Panel 2 Left -->
    <rect x="60" y="420" width="330" height="420" rx="12" fill="url(#cardBg)" stroke="rgba(6,182,212,0.4)" stroke-width="2"/>
    <circle cx="225" cy="600" r="70" fill="#7c3aed" opacity="0.3"/>
    <text x="225" y="610" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#38bdf8" text-anchor="middle">
      PAGE ${pageNum}
    </text>

    <!-- Panel 2 Right -->
    <rect x="410" y="420" width="330" height="420" rx="12" fill="url(#cardBg)" stroke="rgba(244,63,94,0.4)" stroke-width="2"/>
    <polygon points="575,520 630,640 520,640" fill="#f43f5e" opacity="0.4"/>
    <text x="575" y="670" font-family="Arial, sans-serif" font-size="16" fill="#f1f5f9" text-anchor="middle">
      "The veil breaks now..."
    </text>

    <!-- Panel 3 Bottom Climax -->
    <rect x="60" y="860" width="680" height="260" rx="12" fill="url(#cardBg)" stroke="rgba(168,85,247,0.5)" stroke-width="2"/>
    <text x="400" y="980" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#a855f7" text-anchor="middle">
      TO BE CONTINUED...
    </text>
    <text x="400" y="1080" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
      Elder's Veil Comic Platform • Page ${pageNum}
    </text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function generateSvgCover(title, type, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <defs>
      <linearGradient id="coverBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#coverBg)"/>
    <rect x="20" y="20" width="360" height="560" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" rx="12"/>
    
    <!-- Title Emblem -->
    <circle cx="200" cy="240" r="90" fill="none" stroke="${accentColor}" stroke-width="4" opacity="0.6"/>
    <polygon points="200,160 230,220 300,240 240,280 260,350 200,310 140,350 160,280 100,240 170,220" fill="${accentColor}" opacity="0.8"/>

    <!-- Badge -->
    <rect x="30" y="30" width="80" height="28" rx="6" fill="#7c3aed"/>
    <text x="70" y="49" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#ffffff" text-anchor="middle">
      ${type.toUpperCase()}
    </text>

    <!-- Title Text -->
    <rect x="20" y="440" width="360" height="140" fill="rgba(15,23,42,0.85)"/>
    <text x="200" y="490" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">
      ${title.toUpperCase()}
    </text>
    <text x="200" y="520" font-family="Arial, sans-serif" font-weight="600" font-size="14" fill="#a855f7" text-anchor="middle">
      OFFICIAL EDITION
    </text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function generateSvgBanner(title, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="450" viewBox="0 0 1200 450">
    <defs>
      <linearGradient id="banBg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="50%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="450" fill="url(#banBg)"/>
    <circle cx="1000" cy="225" r="220" fill="rgba(255,255,255,0.05)"/>
    <text x="100" y="210" font-family="Arial, sans-serif" font-weight="900" font-size="48" fill="#ffffff">
      ${title.toUpperCase()}
    </text>
    <text x="100" y="260" font-family="Arial, sans-serif" font-size="22" fill="#38bdf8">
      FEATURED PREMIUM RELEASE • READ ALL CHAPTERS NOW
    </text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

async function seedInitialData() {
  try {
    console.log('[Seed] Seeding initial database data...');

    // Seed Admin & Default User
    const adminExists = await User.findByEmail('admin@comicverse.com');
    if (!adminExists) {
      await User.create({
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

    // Seed Comics if empty
    const existingComics = await Comic.getAll({ limit: 10 });
    if (existingComics.length === 0) {
      const seedComics = [
        {
          id: 'comic-001',
          title: 'Shadow Monarch: Rebirth',
          slug: 'shadow-monarch-rebirth',
          description: 'In a world shattered by dimensional rifts, Jin-Woo awakens as the singular Lord of Shadows. Wielding ancient necromantic powers, he must ascend beyond mortality to defeat the Monarchs of Chaos.',
          author: 'Chugong',
          artist: 'DUBU (REDICE)',
          status: 'ongoing',
          type: 'manhwa',
          genres: ['Action', 'Fantasy', 'Supernatural'],
          coverImage: generateSvgCover('Shadow Monarch', 'manhwa', '#7c3aed'),
          bannerImage: generateSvgBanner('Shadow Monarch: Rebirth', '#4c1d95'),
          rating: 4.9,
          views: 142800,
          releaseYear: 2026,
          language: 'English'
        },
        {
          id: 'comic-002',
          title: "Elder's Veil: Dark Covenant",
          slug: 'elders-veil-dark-covenant',
          description: 'Beyond the mortal mist lies the Elder Veil. Kael, an exiled spellblade, unlocks forbidden runes that grant him mastery over dark space-time illusions.',
          author: 'Aeliana Vance',
          artist: 'Kurogane Studio',
          status: 'ongoing',
          type: 'manga',
          genres: ['Fantasy', 'Mystery', 'Action'],
          coverImage: generateSvgCover("Elder's Veil", 'manga', '#06b6d4'),
          bannerImage: generateSvgBanner("Elder's Veil: Dark Covenant", '#0e7490'),
          rating: 4.85,
          views: 98500,
          releaseYear: 2026,
          language: 'English'
        },
        {
          id: 'comic-003',
          title: 'Cyberpunk Ninja 2099',
          slug: 'cyberpunk-ninja-2099',
          description: 'Neo-Tokyo, 2099. Enhanced with neural cybernetics and dual plasma katanas, Ren hunts down rogue megacorporations controlling humanity’s digital soul.',
          author: 'Kenji Takahashi',
          artist: 'Yukihiro Sato',
          status: 'ongoing',
          type: 'manhua',
          genres: ['Sci-Fi', 'Cyberpunk', 'Action'],
          coverImage: generateSvgCover('Cyberpunk Ninja', 'manhua', '#f43f5e'),
          bannerImage: generateSvgBanner('Cyberpunk Ninja 2099', '#be123c'),
          rating: 4.75,
          views: 84300,
          releaseYear: 2025,
          language: 'English'
        },
        {
          id: 'comic-004',
          title: 'Celestial Mage Ascension',
          slug: 'celestial-mage-ascension',
          description: 'Betrayed by his supreme council, Archmage Zephyr is reborn 1000 years in the future with full memory of forbidden astral spells.',
          author: 'Li Wei',
          artist: 'Dragon Studio',
          status: 'completed',
          type: 'manhwa',
          genres: ['Fantasy', 'Adventure'],
          coverImage: generateSvgCover('Celestial Mage', 'manhwa', '#eab308'),
          bannerImage: generateSvgBanner('Celestial Mage Ascension', '#ca8a04'),
          rating: 4.65,
          views: 67100,
          releaseYear: 2024,
          language: 'English'
        }
      ];

      for (const comicData of seedComics) {
        const createdComic = await Comic.create(comicData);

        // Add 3 Chapters for each comic with 4 pages each
        for (let chNum = 1; chNum <= 3; chNum++) {
          const chId = `chapter-${createdComic.id}-${chNum}`;
          const pages = [
            generateSvgComicPage(createdComic.title, chNum, 1, ['#0f172a', '#1e1b4b']),
            generateSvgComicPage(createdComic.title, chNum, 2, ['#18181b', '#27272a']),
            generateSvgComicPage(createdComic.title, chNum, 3, ['#020617', '#0f172a']),
            generateSvgComicPage(createdComic.title, chNum, 4, ['#1e1b4b', '#4c1d95'])
          ];

          await Chapter.create({
            id: chId,
            comicId: createdComic.id,
            chapterNumber: chNum,
            title: chNum === 1 ? 'Awakening' : (chNum === 2 ? 'The Unbroken Seal' : 'Realm of Shadows'),
            releaseDate: new Date().toISOString().split('T')[0],
            pages
          });
        }
      }
      console.log('[Seed] Comics and multi-page Chapters seeded successfully.');
    }

    // Save standard JSON backup file in frontend/data/comics.json as required by prompt
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
