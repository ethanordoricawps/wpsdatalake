// ─────────────────────────────────────────────────────────────────────────
// SOURCE OF TRUTH — carried over verbatim from the 2D canvas design
// (The WPS Data Lake.html). Do NOT invent new data, colors, or zone meaning.
//
// The lake's four basins ARE the four WPS data functions.
// Data-state is UNCONFIRMED until the discovery questionnaires return — every
// surfaced answer keeps the "Illustrative — pending discovery" disclaimer.
// ─────────────────────────────────────────────────────────────────────────

// v      = share of the lake (basin size, sums ~1.0)
// bright = glow weight (emissive intensity multiplier)
// color  = [r,g,b] basin glow + label tint (0-255)
// feed   = [x,y] normalized shoreline inflow point (0..1) particles drift FROM
// sources= the two data sources surfaced on click / "ask the lake"
export const ZONES = {
  eng:   { name: 'Engineering',               v: 0.34, bright: 1.0,  color: [79, 200, 235],  feed: [0.16, 0.20], sources: ['Azure databases', 'GitHub repositories'] },
  field: { name: 'Field Ops & Deployments',   v: 0.28, bright: 0.84, color: [79, 221, 176],  feed: [0.84, 0.20], sources: ['field deployment records', 'site / camera data (category)'] },
  part:  { name: 'Partnerships',              v: 0.13, bright: 0.55, color: [120, 150, 225], feed: [0.16, 0.84], sources: ['partner records', 'shared program data'] },
  fund:  { name: 'Fundraising & Development', v: 0.25, bright: 0.76, color: [180, 215, 120], feed: [0.84, 0.84], sources: ['donor records (category)', 'grants & gifts ledger'] },
};

// Display order (matches the 2D file's label corners: TL, TR, BL, BR)
export const ZONE_KEYS = ['eng', 'field', 'part', 'fund'];

// Starting query counts (the live "queries served" tickers in the 2D version)
export const START_COUNTS = { eng: 1204, field: 847, part: 612, fund: 933 };

// Palette (from the 2D file)
export const PALETTE = {
  jungleFar:   '#0c2113',
  jungleNear:  '#07150c',
  waterTop:    '#15463f',
  waterMid:    '#0e342f',
  waterDeep:   '#0a2622',
  shoreIn:     '#6f5a39',
  shoreOut:    '#4a3c26',
  sunPool:     [240, 238, 200], // rgba(240,238,200, ...)
  shimmer:     [185, 215, 160], // rgba(185,215,160, ...)
  sparkle:     [225, 238, 205], // rgba(225,238,205, ...)
  fog:         '#07150c',
  ink:         '#EDE7D5',       // primary UI text
};

// Foliage color pairs (base -> highlight), reuse for instanced tints
export const FOLIAGE = [
  ['#12301b', '#214a2c'],
  ['#173d20', '#28582f'],
  ['#1c4d26', '#317341'],
  ['#235c2c', '#3c8a4d'],
  ['#2a6a34', '#4d9a5b'],
  ['#356b30', '#7cab50'],
  ['#1a4423', '#2d6336'],
];

// "Ask the lake" keyword -> zone map (reuse verbatim)
export const ASK_MAP = [
  { z: 'eng',   keys: ['engineering', 'engineer', 'azure', 'github', 'database', 'repo', 'code', 'devops'] },
  { z: 'field', keys: ['field', 'deployment', 'deploy', 'site', 'camera', 'ops', 'sensor', 'ranger'] },
  { z: 'part',  keys: ['partner', 'partnership', 'mou', 'program', 'collaborat', 'agreement'] },
  { z: 'fund',  keys: ['fundrais', 'donor', 'grant', 'gift', 'development', 'funding', 'donation', 'philanthrop'] },
];

const NO_MATCH = 'Try asking which function a source belongs to, or where a function’s data lives.';

// Run the ASK_MAP against a query -> { zone, answer, ok }
export function askLake(query) {
  const t = (query || '').toLowerCase().trim();
  if (!t) return { zone: null, answer: NO_MATCH, ok: false };
  for (const m of ASK_MAP) {
    if (m.keys.some((k) => t.includes(k))) {
      const z = ZONES[m.z];
      return {
        zone: m.z,
        answer: `${z.name} draws from ${z.sources[0]} and ${z.sources[1]}.  Illustrative — pending discovery.`,
        ok: true,
      };
    }
  }
  return { zone: null, answer: NO_MATCH, ok: false };
}

// rgb [0..255] -> normalized [0..1] triplet for three.js Color
export function rgb01(c) {
  return [c[0] / 255, c[1] / 255, c[2] / 255];
}

// rgb [0..255] -> css string
export function rgbCss(c, a = 1) {
  return a === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

// lift a zone color toward white so label text stays legible over the water
// (the raw basin tints — esp. partnerships/fundraising — read too pale as text)
export function rgbCssLight(c, amt = 0.42, a = 1) {
  const m = (v) => Math.round(v + (255 - v) * amt);
  return rgbCss([m(c[0]), m(c[1]), m(c[2])], a);
}
