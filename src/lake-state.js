// Shared, non-React lake interaction state (ripples + hover), read by 3D
// components in useFrame. Counts/answer live in React (App) for the HTML layer.

import { CELLS } from './data/lake.js';
import { ZONES, rgb01 } from './data/zones.js';

export const lake = {
  ripples: [], // { key, t, color:[r,g,b 0..1] }
  hovered: null, // basin key under the pointer (drives glow lift)
};

const MAX_RIPPLES = 14;

// Spawn an expanding ripple at a basin (the 2D hitZone ripple).
export function addRipple(key) {
  if (!ZONES[key]) return;
  if (lake.ripples.length >= MAX_RIPPLES) lake.ripples.shift();
  lake.ripples.push({ key, t: 0, color: rgb01(ZONES[key].color), cx: CELLS.cells[key].cx, cz: CELLS.cells[key].cz });
}

// dev-only debug handle (used for headless verification)
if (import.meta.env && import.meta.env.DEV) {
  window.__lake = { lake, addRipple };
}
