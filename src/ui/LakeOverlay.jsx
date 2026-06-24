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
  const [loaded, setLoaded] = useState(false);

  // load the baked glow layers + zone metadata once
  useEffect(() => {
    let alive = true;
    const names = ALL;
    let pending = names.length + 1;
    const done = () => { if (--pending === 0 && alive) setLoaded(true); };
    pending += names.length; // also load the per-zone fill masks
    names.forEach((n) => {
      const im = new Image(); im.onload = done; im.onerror = done; im.src = `/img/zone_${n}.png`;
      imgs.current[n] = im;
      const fl = new Image(); fl.onload = done; fl.onerror = done; fl.src = `/img/zone_${n}_fill.png`;
      imgs.current[n + '_fill'] = fl;
    });
    fetch('/img/lake_zones.json').then((r) => r.json()).then((m) => {
      if (!alive) return;
      meta.current = m;
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

    const off = document.createElement('canvas'); // offscreen for section-clipped ripples
    const offCtx = off.getContext('2d');
    const resize = () => {
      canvas.width = off.width = window.innerWidth;
      canvas.height = off.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const vw = window.innerWidth, vh = window.innerHeight;
      const c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);

      if (active) {
        // ---- section glows: a color-tint pass (saturates the water) + a
        //      brighter additive pass (the glow), with pulse + hover ----
        ALL.forEach((k, i) => { const target = lake.hovered === k ? 1 : 0; hover[k] += (target - hover[k]) * 0.12; });
        // Crossfade per section: at rest = center-weighted glow; on hover that
        // fades OUT and a uniform body fill fades IN, so a hovered section is
        // evenly bright across its whole body (no center hotspot).
        // pass 1 — color tint (passive glow * (1-hover)  +  fill * hover)
        ctx.globalCompositeOperation = 'source-over';
        ALL.forEach((k) => {
          const g = imgs.current[k], f = imgs.current[k + '_fill'];
          const baseT = k === 'inflow' ? 0.22 : 0.32;
          if (g && g.width && hover[k] < 0.99) { ctx.globalAlpha = baseT * (1 - hover[k]); ctx.drawImage(g, c.ox, c.oy, c.w, c.h); }
          if (f && f.width && hover[k] > 0.01) { ctx.globalAlpha = 0.36 * hover[k]; ctx.drawImage(f, c.ox, c.oy, c.w, c.h); }
        });
        // pass 2 — additive glow (same crossfade)
        ctx.globalCompositeOperation = 'lighter';
        ALL.forEach((k, i) => {
          const g = imgs.current[k], f = imgs.current[k + '_fill'];
          const pulse = animate ? 0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.7) : 0.7;
          const base = k === 'inflow' ? 0.15 : 0.26;
          if (g && g.width && hover[k] < 0.99) { ctx.globalAlpha = base * (0.65 + 0.35 * pulse) * (1 - hover[k]); ctx.drawImage(g, c.ox, c.oy, c.w, c.h); }
          if (f && f.width && hover[k] > 0.01) { ctx.globalAlpha = base * (0.65 + 0.35 * pulse) * hover[k]; ctx.drawImage(f, c.ox, c.oy, c.w, c.h); }
        });
        ctx.globalAlpha = 1;

        // ---- ripples, clipped to their section so they bend around its edges ----
        const rs = lake.ripples, cen = meta.current && meta.current.centroids;
        // advance + cull, group active ripples by zone
        const byZone = {};
        for (let i = rs.length - 1; i >= 0; i--) {
          const r = rs[i];
          if (animate) r.t += 0.011;
          if (r.t >= 1) { rs.splice(i, 1); continue; }
          (byZone[r.key] || (byZone[r.key] = [])).push(r);
        }
        const maxR = Math.max(c.w, c.h) * 0.55; // generous; the mask shapes it
        for (const k in byZone) {
          const ctr = cen && cen[k]; const fl = imgs.current[k + '_fill'];
          if (!ctr || !fl || !fl.width) continue;
          const [px, py] = toPx(ctr[0], ctr[1], c);
          offCtx.clearRect(0, 0, vw, vh);
          offCtx.globalCompositeOperation = 'source-over';
          for (const r of byZone[k]) {
            const rad = r.t * maxR;
            offCtx.beginPath();
            offCtx.arc(px, py, rad, 0, Math.PI * 2);
            offCtx.strokeStyle = `rgba(225,238,205,${(1 - r.t) * 0.65})`;
            offCtx.lineWidth = 3 * (1 - r.t) + 1;
            offCtx.stroke();
          }
          // keep only the part inside the section (soft fill edge = it bends/fades at the border)
          offCtx.globalCompositeOperation = 'destination-in';
          offCtx.drawImage(fl, c.ox, c.oy, c.w, c.h);
          offCtx.globalCompositeOperation = 'source-over';
          // composite the masked ripple onto the scene (additive glint)
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(off, 0, 0);
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
