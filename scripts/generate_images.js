const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 1. Generate Logo SVG
ensureDir(path.join(rootDir, 'assets/images/logo'));
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="24" fill="url(#grad1)"/>
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M35 30 H85 V90 H35 Z" fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>
  <path d="M48 45 H72 M48 60 H72 M48 75 H62" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(rootDir, 'assets/images/logo/logo.svg'), logoSvg);

// 2. Comic Graphic Specs for Mock Image Generation
const comicThemes = [
  {
    id: 'comic-001',
    title: 'Solo Leveling',
    subtitle: 'Shadow Monarch',
    c1: '#0f172a', c2: '#3b82f6', accent: '#7c3aed',
    icon: '⚔️'
  },
  {
    id: 'comic-002',
    title: 'Cyberpunk',
    subtitle: 'Neon Samurai',
    c1: '#09090b', c2: '#06b6d4', accent: '#ec4899',
    icon: '🤖'
  },
  {
    id: 'comic-003',
    title: 'Celestial Magic',
    subtitle: 'Royal Academy',
    c1: '#1e1b4b', c2: '#818cf8', accent: '#fbbf24',
    icon: '✨'
  },
  {
    id: 'comic-004',
    title: 'Shadows of Eldoria',
    subtitle: 'Abyssal Breach',
    c1: '#18181b', c2: '#dc2626', accent: '#f97316',
    icon: '🗡️'
  },
  {
    id: 'comic-005',
    title: 'Heartbeats',
    subtitle: 'In Moonlight',
    c1: '#31103f', c2: '#f472b6', accent: '#e879f9',
    icon: '🌙'
  },
  {
    id: 'comic-006',
    title: 'Apex Striker',
    subtitle: 'Football Dreams',
    c1: '#064e3b', c2: '#10b981', accent: '#facc15',
    icon: '⚽'
  },
  {
    id: 'comic-007',
    title: 'Quantum Detective',
    subtitle: 'Parallel Timelines',
    c1: '#111827', c2: '#6366f1', accent: '#38bdf8',
    icon: '🔍'
  },
  {
    id: 'comic-008',
    title: 'Haunted Manor',
    subtitle: 'Spectral Whispers',
    c1: '#172554', c2: '#64748b', accent: '#a855f7',
    icon: '👻'
  }
];

// SVG Generator Helper for Covers (300x440)
function createCoverSVG(comic) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="440" viewBox="0 0 300 440">
    <defs>
      <linearGradient id="g_${comic.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${comic.c1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${comic.c2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="300" height="440" fill="url(#g_${comic.id})" />
    <circle cx="150" cy="180" r="85" fill="${comic.accent}" opacity="0.25" />
    <text x="150" y="195" font-size="72" text-anchor="middle">${comic.icon}</text>
    <rect x="0" y="300" width="300" height="140" fill="rgba(11,11,15,0.85)" />
    <text x="150" y="345" font-family="'Outfit', sans-serif" font-weight="bold" font-size="20" fill="#ffffff" text-anchor="middle">${comic.title}</text>
    <text x="150" y="375" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="${comic.accent}" text-anchor="middle">${comic.subtitle}</text>
    <rect x="20" y="395" width="260" height="2" fill="${comic.accent}" opacity="0.6" />
    <text x="150" y="420" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">COMICVERSE ORIGINAL</text>
  </svg>`;
}

// SVG Generator Helper for Banners (1200x500)
function createBannerSVG(comic) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
    <defs>
      <linearGradient id="gb_${comic.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${comic.c1};stop-opacity:1" />
        <stop offset="50%" style="stop-color:${comic.c2};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${comic.accent};stop-opacity:0.8" />
      </linearGradient>
    </defs>
    <rect width="1200" height="500" fill="url(#gb_${comic.id})" />
    <circle cx="950" cy="250" r="220" fill="${comic.accent}" opacity="0.2" />
    <text x="950" y="290" font-size="140" text-anchor="middle">${comic.icon}</text>
  </svg>`;
}

// SVG Generator Helper for Chapter Webcomic Panels (800x1200)
function createChapterPageSVG(comic, chNum, pageNum) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
    <rect width="800" height="1200" fill="#0d0d12" />
    
    <!-- Panel 1 -->
    <rect x="30" y="40" width="740" height="340" rx="12" fill="${comic.c1}" stroke="#27273a" stroke-width="4"/>
    <text x="70" y="90" font-family="'Outfit', sans-serif" font-size="24" font-weight="bold" fill="#ffffff">${comic.title.toUpperCase()}</text>
    <text x="70" y="125" font-family="sans-serif" font-size="16" fill="${comic.accent}">CHAPTER ${chNum} - PAGE ${pageNum}</text>
    <circle cx="640" cy="200" r="70" fill="${comic.c2}" opacity="0.3"/>
    <text x="640" y="225" font-size="64" text-anchor="middle">${comic.icon}</text>

    <!-- Comic Speech Bubble -->
    <rect x="70" y="180" width="380" height="120" rx="18" fill="#ffffff" />
    <polygon points="120,300 140,300 110,325" fill="#ffffff"/>
    <text x="95" y="225" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">"Step into the threshold, Jinwoo..."</text>
    <text x="95" y="255" font-family="sans-serif" font-size="14" fill="#475569">The system screen blinks softly.</text>

    <!-- Panel 2 -->
    <rect x="30" y="410" width="355" height="420" rx="12" fill="${comic.c2}" opacity="0.15" stroke="#27273a" stroke-width="4"/>
    <text x="207" y="620" font-size="80" text-anchor="middle">${comic.icon}</text>
    <text x="207" y="720" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff" text-anchor="middle">PANEL ${pageNum}.A</text>

    <!-- Panel 3 -->
    <rect x="415" y="410" width="355" height="420" rx="12" fill="${comic.c1}" stroke="#27273a" stroke-width="4"/>
    <rect x="440" y="440" width="305" height="80" rx="14" fill="#ffffff"/>
    <text x="460" y="485" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">"Is this the power of leveling up?!"</text>
    <circle cx="592" cy="640" r="75" fill="${comic.accent}" opacity="0.4"/>
    <text x="592" y="665" font-size="64" text-anchor="middle">⚡</text>

    <!-- Panel 4 Action Splash -->
    <rect x="30" y="860" width="740" height="290" rx="12" fill="url(#splash_grad_${comic.id}_${pageNum})" stroke="${comic.accent}" stroke-width="3"/>
    <defs>
      <linearGradient id="splash_grad_${comic.id}_${pageNum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${comic.c1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${comic.accent};stop-opacity:0.6" />
      </linearGradient>
    </defs>
    <text x="400" y="980" font-family="'Outfit', sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle" font-style="italic">BOOM!!</text>
    <text x="400" y="1030" font-family="sans-serif" font-size="16" fill="${comic.accent}" text-anchor="middle">To be continued on next page...</text>
    
    <!-- Footer Page Number -->
    <text x="760" y="1180" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="end">Page ${pageNum}</text>
  </svg>`;
}

// Run Generation Loop
comicThemes.forEach(comic => {
  const comicDir = path.join(rootDir, `assets/images/comics/${comic.id}`);
  ensureDir(comicDir);

  // Write Cover & Banner
  fs.writeFileSync(path.join(comicDir, 'cover.svg'), createCoverSVG(comic));
  fs.writeFileSync(path.join(comicDir, 'banner.svg'), createBannerSVG(comic));

  // Write Chapters
  const chaptersDir = path.join(comicDir, 'chapters');
  [1, 2, 3].forEach(chNum => {
    const chDir = path.join(chaptersDir, `chapter-00${chNum}`);
    ensureDir(chDir);
    [1, 2, 3, 4].forEach(pgNum => {
      const pgSvg = createChapterPageSVG(comic, chNum, pgNum);
      const pgStr = pgNum < 10 ? `00${pgNum}` : `0${pgNum}`;
      fs.writeFileSync(path.join(chDir, `${pgStr}.svg`), pgSvg);
    });
  });
});

console.log('Successfully generated all comic asset mockups!');
