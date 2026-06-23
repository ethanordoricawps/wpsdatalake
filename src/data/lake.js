// ─────────────────────────────────────────────────────────────────────────
// Lake geometry — the 3D twin of the 2D file's lakeGeom / computeCells / traceOn.
//
// World layout: lake centered at the origin on the XZ plane, water at y = 0,
// camera looking down. Screen-space (x right, y down) maps to world (x right,
// z "south"/away). So 2D "top" -> -Z, 2D "bot" -> +Z.
//
// The 2D ellipse had rx = 0.38w, ry = 0.32h (≈ a 2:1 wide ellipse on 16:9).
// We keep that proportion in world units.
// ─────────────────────────────────────────────────────────────────────────

import { ZONES } from './zones.js';

// Ellipse half-extents in world units (X across, Z deep). ~2:1 like the 2D view.
export const LAKE = {
  rx: 12,
  rz: 6,
  y: 0, // water plane height
};

// Bounding-box multiplier the 2D computeCells used (×1.16 of the ellipse).
const CELL_BOX = 1.16;

// Shoreline radial wobble — the 2D traceOn() expression. `a` is the angle.
// Returns the radius multiplier applied to (rx, rz) for an organic, non-circular edge.
export function shoreWobble(a) {
  return (
    1 +
    0.06 * Math.sin(3 * a + 0.6) +
    0.035 * Math.sin(2 * a - 0.4) +
    0.02 * Math.sin(5 * a + 1.2) +
    0.015 * Math.sin(7 * a - 0.7)
  );
}

// A point on the (wobbled) shoreline at angle a, scaled by `scale` (1 = waterline).
export function shorePoint(a, scale = 1) {
  const rr = shoreWobble(a) * scale;
  return [Math.cos(a) * LAKE.rx * rr, Math.sin(a) * LAKE.rz * rr];
}

// Mirror of computeCells(): partition the lake into a weighted 2×2 grid.
//   left column  = eng (top) / part (bottom)
//   right column = field (top) / fund (bottom)
// Returns each cell's world bounds + center (cx, cz) and the source ZONE.
export function computeCells() {
  const Z = ZONES;
  const leftW = Z.eng.v + Z.part.v;
  const rightW = Z.field.v + Z.fund.v;
  const total = leftW + rightW;

  const left = -LAKE.rx * CELL_BOX;
  const right = LAKE.rx * CELL_BOX;
  const top = -LAKE.rz * CELL_BOX; // -Z
  const bot = LAKE.rz * CELL_BOX; //  +Z
  const BW = right - left;
  const BH = bot - top;

  const xs = left + BW * (leftW / total); // vertical divide
  const zL = top + BH * (Z.eng.v / leftW); // left-column horizontal divide
  const zR = top + BH * (Z.field.v / rightW); // right-column horizontal divide

  const mk = (x0, z0, x1, z1, z) => ({
    x0, z0, x1, z1, z,
    cx: (x0 + x1) / 2,
    cz: (z0 + z1) / 2,
    w: Math.abs(x1 - x0),
    d: Math.abs(z1 - z0),
  });

  return {
    bounds: { left, right, top, bot, xs, zL, zR },
    cells: {
      eng:   mk(left, top, xs,    zL,  Z.eng),
      part:  mk(left, zL,  xs,    bot, Z.part),
      field: mk(xs,   top, right, zR,  Z.field),
      fund:  mk(xs,   zR,  right, bot, Z.fund),
    },
  };
}

// Map a normalized feed point [0..1, 0..1] (2D shoreline inflow) to a world
// point just outside the basins. fx across X, fy across Z.
export function feedToWorld(feed) {
  const [fx, fy] = feed;
  const spanX = LAKE.rx * 1.3;
  const spanZ = LAKE.rz * 1.3;
  return [(fx * 2 - 1) * spanX, (fy * 2 - 1) * spanZ];
}

// Precomputed cells (geometry is static once LAKE is fixed).
export const CELLS = computeCells();

// Which basin contains a world XZ point (mirror of the 2×2 partition).
// Returns null if the point is outside the lake ellipse.
export function zoneAt(x, z) {
  const a = Math.atan2(z / LAKE.rz, x / LAKE.rx);
  const norm = Math.hypot(x / LAKE.rx, z / LAKE.rz) / shoreWobble(a);
  if (norm > 1.0) return null; // outside the waterline
  const { xs, zL, zR } = CELLS.bounds;
  if (x <= xs) return z <= zL ? 'eng' : 'part';
  return z <= zR ? 'field' : 'fund';
}
