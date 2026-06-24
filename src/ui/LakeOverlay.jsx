import { useEffect, useRef, useState } from 'react';
import { lake } from '../lake-state.js';

const ZONE_KEYS = ['eng', 'field', 'part', 'fund'];
const ALL = ['eng', 'field', 'part', 'fund', 'inflow'];

// object-fit:cover mapping of the 16:9 frame into the viewport
function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}
const toPx = (nx, ny, c) => [c.ox + nx * c.w, c.oy + ny * c.h];

export default function LakeOverlay({ active, animate = true, onHover, onQuery, onReady }) {
  const canvasRef = useRef();
  const imgs = useRef({});
  const meta = useRef(null);
  const motes = useRef([]);
  const [loaded, setLoaded] = useState(false);

  // load the baked glow layers + zone metadata once
  useEffect(() => {
    let alive = true;
    const names = ALL;
    let pending = names.length + 1;
    const done = () => { if (--pending === 0 && alive) setLoaded(true); };
    names.forEach((n) => {
      const im = new Image();
      im.onload = done;
      im.onerror = done;
      im.src = `/img/zone_${n}.png`;
      imgs.current[n] = im;
    });
    fetch('/img/lake_zones.json').then((r) => r.json()).then((m) => {
      if (!alive) return;
      meta.current = m;
      // seed inflow motes along the arm
      motes.current = Array.from({ length: 9 }, (_, i) => ({ p: (i / 9 + Math.random() * 0.2) % 1, speed: 0.07 + Math.random() * 0.05 }));
      onReady?.(m.centroids);
      done();
    }).catch(done);
    return () => { alive = false; };
  }, [onReady]);

  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf, t0 = performance.now();
    const hover = {}; ALL.forEach((k) => (hover[k] = 0));

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const vw = window.innerWidth, vh = window.innerHeight;
      const c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);

      if (active) {
        // ---- section glows (additive, feathered PNGs) with pulse + hover ----
        ctx.globalCompositeOperation = 'lighter';
        ALL.forEach((k, i) => {
          const im = imgs.current[k];
          if (!im || !im.width) return;
          const target = lake.hovered === k ? 1 : 0;
          hover[k] += (target - hover[k]) * 0.12;
          const pulse = animate ? 0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.7) : 0.7;
          const base = k === 'inflow' ? 0.34 : 0.42;
          ctx.globalAlpha = Math.min(1, base + pulse * 0.12 + hover[k] * 0.3);
          ctx.drawImage(im, c.ox, c.oy, c.w, c.h);
        });
        ctx.globalAlpha = 1;

        // ---- inflow motes drift from the arm tip into the lake ----
        const m = meta.current;
        if (m && m.inflow && m.inflow.target) {
          const [tx, ty] = toPx(m.inflow.tip[0], m.inflow.tip[1], c);
          const [bx, by] = toPx(m.inflow.target[0], m.inflow.target[1], c);
          motes.current.forEach((mo) => {
            if (animate) { mo.p += mo.speed * 0.016; if (mo.p >= 1) mo.p -= 1; }
            const e = mo.p;
            const x = tx + (bx - tx) * e, y = ty + (by - ty) * e;
            const fade = Math.sin(mo.p * Math.PI);
            ctx.fillStyle = `rgba(225,240,220,${0.55 * fade})`;
            ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
          });
        }

        // ---- ripples at section centroids ----
        const rs = lake.ripples, cen = meta.current && meta.current.centroids;
        for (let i = rs.length - 1; i >= 0; i--) {
          const r = rs[i];
          if (animate) r.t += 0.012;
          if (r.t >= 1) { rs.splice(i, 1); continue; }
          const ctr = cen && cen[r.key]; if (!ctr) continue;
          const [px, py] = toPx(ctr[0], ctr[1], c);
          const rad = r.t * Math.min(c.w, c.h) * 0.22;
          ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(225,238,205,${(1 - r.t) * 0.5})`;
          ctx.lineWidth = 1.6 * (1 - r.t) + 0.5; ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [loaded, active, animate]);

  // pointer -> normalized frame coords -> zone via the hit-test grid
  const zoneAt = (clientX, clientY) => {
    const m = meta.current; if (!m) return null;
    const c = cover(window.innerWidth, window.innerHeight);
    const nx = (clientX - c.ox) / c.w, ny = (clientY - c.oy) / c.h;
    if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
    const gx = Math.min(m.grid.w - 1, Math.max(0, (nx * m.grid.w) | 0));
    const gy = Math.min(m.grid.h - 1, Math.max(0, (ny * m.grid.h) | 0));
    const z = m.grid.data[gy * m.grid.w + gx];
    return z >= 0 && z < 4 ? ZONE_KEYS[z] : null; // inflow (4) isn't queryable
  };

  return (
    <canvas
      ref={canvasRef}
      className="lake-overlay"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      onPointerMove={(e) => active && onHover?.(zoneAt(e.clientX, e.clientY))}
      onPointerLeave={() => active && onHover?.(null)}
      onClick={(e) => { if (!active) return; const z = zoneAt(e.clientX, e.clientY); if (z) onQuery?.(z); }}
    />
  );
}
