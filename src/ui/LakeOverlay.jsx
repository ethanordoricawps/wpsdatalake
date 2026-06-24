import { useEffect, useRef } from 'react';
import { ZONES, ZONE_KEYS, rgbCss } from '../data/zones.js';
import { lake } from '../lake-state.js';

// The lake's footprint inside the 16:9 video frame (normalized 0..1), fitted to
// aerial.mp4. Tune these four numbers to sit the data layer on the real water.
export const LAKE_SCREEN = { cx: 0.5, cy: 0.46, rx: 0.45, ry: 0.32 };

// Per-zone glow placement in the lake's 2×2 quadrants (matches the 2D layout:
// eng top-left, field top-right, part bottom-left, fund bottom-right) + a
// shoreline inflow point the motes drift from.
const QX = 0.4, QYT = 0.44, QYB = 0.46;
const ZPOS = {
  eng:   { qx: -QX, qy: -QYT, feed: [-0.95, -0.7] },
  field: { qx: QX,  qy: -QYT, feed: [0.95, -0.7] },
  part:  { qx: -QX, qy: QYB,  feed: [-0.9, 0.8] },
  fund:  { qx: QX,  qy: QYB,  feed: [0.9, 0.8] },
};

// object-fit:cover mapping of the 16:9 frame into the viewport
function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h, ox, oy;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  ox = (vw - w) / 2;
  oy = (vh - h) / 2;
  return { ox, oy, w, h };
}

// normalized frame point -> screen px
function toPx(nx, ny, c) {
  return [c.ox + nx * c.w, c.oy + ny * c.h];
}

// which basin a normalized-frame point falls in (null if outside the lake)
export function zoneAtScreen(nx, ny) {
  const dx = (nx - LAKE_SCREEN.cx) / LAKE_SCREEN.rx;
  const dy = (ny - LAKE_SCREEN.cy) / LAKE_SCREEN.ry;
  if (dx * dx + dy * dy > 1) return null;
  if (dx <= 0) return dy <= 0 ? 'eng' : 'part';
  return dy <= 0 ? 'field' : 'fund';
}

export default function LakeOverlay({ active, animate = true, onHover, onQuery }) {
  const canvasRef = useRef();
  const motesRef = useRef(null);

  // seed inflow motes once
  if (!motesRef.current) {
    const motes = [];
    ZONE_KEYS.forEach((k) => {
      for (let i = 0; i < 6; i++) {
        motes.push({ k, p: (i / 6 + Math.random() * 0.3) % 1, speed: 0.06 + Math.random() * 0.05 });
      }
    });
    motesRef.current = motes;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t0 = performance.now();

    const resize = () => {
      const dpr = 1; // overlay is soft glows/ripples — DPR 1 is plenty and far lighter
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const vw = window.innerWidth, vh = window.innerHeight;
      const c = cover(vw, vh);
      const lakeMin = Math.min(LAKE_SCREEN.rx * c.w, LAKE_SCREEN.ry * c.h);
      ctx.clearRect(0, 0, vw, vh);

      if (active) {
        // ---- basin glows (additive radial gradients, pulsing) ----
        ctx.globalCompositeOperation = 'lighter';
        ZONE_KEYS.forEach((k, i) => {
          const z = ZONES[k];
          const pos = ZPOS[k];
          const [px, py] = toPx(
            LAKE_SCREEN.cx + pos.qx * LAKE_SCREEN.rx,
            LAKE_SCREEN.cy + pos.qy * LAKE_SCREEN.ry,
            c,
          );
          const pulse = animate ? 0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.7) : 0.7;
          const hov = lake.hovered === k ? 1 : 0;
          const a = 0.1 + 0.34 * z.bright + pulse * 0.05 + hov * 0.22;
          const rad = lakeMin * (0.46 + z.v * 0.7);
          const g = ctx.createRadialGradient(px, py, rad * 0.04, px, py, rad);
          const col = z.color;
          g.addColorStop(0, rgbCss(col, a));
          g.addColorStop(0.5, rgbCss(col, a * 0.45));
          g.addColorStop(1, rgbCss(col, 0));
          ctx.fillStyle = g;
          ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
        });

        // ---- inflow motes drift from shore -> basin center ----
        motesRef.current.forEach((m) => {
          if (animate) { m.p += m.speed * 0.016; if (m.p >= 1) m.p -= 1; }
          const z = ZONES[m.k];
          const pos = ZPOS[m.k];
          const [fx, fy] = toPx(
            LAKE_SCREEN.cx + pos.feed[0] * LAKE_SCREEN.rx,
            LAKE_SCREEN.cy + pos.feed[1] * LAKE_SCREEN.ry,
            c,
          );
          const [bx, by] = toPx(
            LAKE_SCREEN.cx + pos.qx * LAKE_SCREEN.rx,
            LAKE_SCREEN.cy + pos.qy * LAKE_SCREEN.ry,
            c,
          );
          const e = m.p;
          const x = fx + (bx - fx) * e;
          const y = fy + (by - fy) * e;
          const fade = Math.sin(m.p * Math.PI);
          ctx.fillStyle = rgbCss(z.color, 0.5 * fade);
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        });

        // ---- ripples (expanding pale rings) ----
        const rs = lake.ripples;
        for (let i = rs.length - 1; i >= 0; i--) {
          const r = rs[i];
          if (animate) r.t += 0.012;
          if (r.t >= 1) { rs.splice(i, 1); continue; }
          const pos = ZPOS[r.key];
          const [px, py] = toPx(
            LAKE_SCREEN.cx + pos.qx * LAKE_SCREEN.rx,
            LAKE_SCREEN.cy + pos.qy * LAKE_SCREEN.ry,
            c,
          );
          const rad = r.t * lakeMin * 1.1;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(225,238,205,${(1 - r.t) * 0.5})`;
          ctx.lineWidth = 1.6 * (1 - r.t) + 0.5;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active, animate]);

  // pointer interaction -> normalized frame coords -> zone
  const handle = (clientX, clientY, click) => {
    if (!active) return;
    const c = cover(window.innerWidth, window.innerHeight);
    const nx = (clientX - c.ox) / c.w;
    const ny = (clientY - c.oy) / c.h;
    const z = zoneAtScreen(nx, ny);
    if (click) {
      if (z) onQuery?.(z);
    } else {
      onHover?.(z);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="lake-overlay"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      onPointerMove={(e) => handle(e.clientX, e.clientY, false)}
      onPointerLeave={() => active && onHover?.(null)}
      onClick={(e) => handle(e.clientX, e.clientY, true)}
    />
  );
}
