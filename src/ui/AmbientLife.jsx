import { useEffect, useRef } from 'react';

// object-fit:cover mapping of the 16:9 frame into the viewport
function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}

// Drifting fog banks over the water + birds occasionally crossing the sky.
// Pure canvas over the held still, so the frozen lake feels alive.
export default function AmbientLife({ active, animate = true }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf, t0 = performance.now(), last = t0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // fog: small amorphous wisps — each is a cluster of soft puffs at random
    // offsets, scattered from the canopies (high) down across the water
    // (y ~0.08..0.62), drifting slowly in alternating directions
    const FOG_N = 12;
    const fog = Array.from({ length: FOG_N }, (_, i) => ({
      x: Math.random(),
      y: 0.08 + (i / FOG_N) * 0.54 + (Math.random() - 0.5) * 0.07,
      r: 0.05 + Math.random() * 0.06,                 // base lobe radius (fraction of frame width)
      speed: (0.0275 + Math.random() * 0.035) * (i % 2 ? 1 : -1),
      a: 0.05 + Math.random() * 0.015,                // per-lobe alpha (lobes overlap to build density)
      puffs: Array.from({ length: 4 + (Math.random() * 4 | 0) }, () => ({
        dx: (Math.random() - 0.5) * 2.6,              // lobe offset, in units of r
        dy: (Math.random() - 0.5) * 1.6,
        s: 0.5 + Math.random() * 0.8,                 // lobe size scale
      })),
    }));

    // birds fly along a depth axis: from a far vanishing point up near the
    // horizon toward the viewer (or the reverse), growing + fading in as they
    // approach. Reads as flying into/out of the distance, matching the flap.
    const birds = [];
    const smooth = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
    const spawnFlock = (single) => {
      const incoming = Math.random() < 0.72;            // mostly flying toward us
      const n = single ? 1 : 3 + (Math.random() * 4 | 0);
      const vpx = 0.4 + Math.random() * 0.2;            // far point, up in the sky strip
      const vpy = 0.05 + Math.random() * 0.05;
      const side = Math.random() < 0.5 ? -1 : 1;
      // "near" = closest to the viewer. Incoming birds keep growing and exit
      // off the frame edge; outgoing birds start just inside it, then recede.
      const nearx = incoming
        ? 0.5 + side * (0.55 + Math.random() * 0.35)    // past the left/right edge
        : 0.5 + side * (0.5 + Math.random() * 0.12);    // spawn at the frame edge
      const neary = incoming
        ? 0.58 + Math.random() * 0.4                    // low, sweeping off the bottom
        : 0.4 + Math.random() * 0.35;
      const dur = incoming ? 7 + Math.random() * 4 : 9 + Math.random() * 5;
      const sizeMax = incoming ? 16 + Math.random() * 10 : 12 + Math.random() * 6;
      for (let i = 0; i < n; i++) {
        birds.push({
          vpx: vpx + (Math.random() - 0.5) * 0.05,
          vpy: vpy + (Math.random() - 0.5) * 0.025,
          nearx: nearx + (Math.random() - 0.5) * 0.07,
          neary: neary + (Math.random() - 0.5) * 0.05,
          incoming, dur,
          age: -i * (single ? 0 : 0.55),                // stagger the flock
          sizeMax: sizeMax * (single ? 1.05 : 1),
          flap: Math.random() * Math.PI * 2,
          flapSpeed: 6 + Math.random() * 3,
        });
      }
    };
    let nextFlock = 2.5, nextSingle = 6; // seconds; first one soon so it's visible

    const drawBird = (b, sx, sy, t, scale, alpha) => {
      const wing = Math.sin(t * b.flapSpeed + b.flap) * 0.5 + 0.5; // 0..1
      const span = scale, lift = scale * (0.28 + wing * 0.55);
      ctx.beginPath();
      ctx.moveTo(sx - span, sy + lift * 0.3);
      ctx.quadraticCurveTo(sx - span * 0.3, sy - lift, sx, sy);
      ctx.quadraticCurveTo(sx + span * 0.3, sy - lift, sx + span, sy + lift * 0.3);
      ctx.strokeStyle = `rgba(22,30,24,${alpha})`;
      ctx.lineWidth = Math.max(0.7, scale * 0.16);
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const vw = window.innerWidth, vh = window.innerHeight, c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);

      // ---- fog: clusters of soft puffs = amorphous wisps ----
      // ease the whole layer in over the first ~6s so it doesn't pop in fully
      // formed on load — it settles to its steady density
      const fogIn = smooth(Math.min(1, t / 6));
      fog.forEach((f) => {
        if (animate) { f.x += f.speed * dt; if (f.x > 1.5) f.x = -0.5; if (f.x < -0.5) f.x = 1.5; }
        const cx = c.ox + f.x * c.w, cy = c.oy + f.y * c.h;
        const baseR = f.r * c.w;
        for (const p of f.puffs) {
          const px = cx + p.dx * baseR, py = cy + p.dy * baseR;
          const pr = baseR * p.s;
          const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
          g.addColorStop(0, `rgba(232,240,232,${f.a * fogIn})`);
          g.addColorStop(1, 'rgba(232,240,232,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
        }
      });

      // ---- birds ----
      if (animate) {
        nextFlock -= dt; nextSingle -= dt;
        if (nextFlock <= 0) { spawnFlock(false); nextFlock = 30 + Math.random() * 22; }
        if (nextSingle <= 0) { spawnFlock(true); nextSingle = 18 + Math.random() * 16; }
      }
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        if (animate) b.age += dt;
        if (b.age < 0) continue;             // staggered flock member, not airborne yet
        const p = b.age / b.dur;             // 0..1 across its flight
        if (p >= 1) { birds.splice(i, 1); continue; }
        // depth: 0 far (tiny/faint) -> 1 near (large/solid)
        const z = b.incoming ? smooth(p) : smooth(1 - p);
        const nx = b.vpx + (b.nearx - b.vpx) * z;   // path runs vp<->near with depth
        const ny = b.vpy + (b.neary - b.vpy) * z;
        const bob = Math.sin(t * 0.6 + b.flap) * 0.004 * z;
        const sx = c.ox + nx * c.w;
        const sy = c.oy + (ny + bob) * c.h;
        const scale = 1.6 + (b.sizeMax - 1.6) * z;
        // incoming: fade in from the far speck, then stay solid as it flies off
        // the edge. outgoing: full near the viewer, dissolve as it recedes.
        const alpha = b.incoming
          ? (0.12 + 0.72 * z) * smooth(p / 0.12)   // fade in from the far speck
          : 0.84 * z;                              // full at the edge, recede to nothing
        drawBird(b, sx, sy, t, scale, alpha);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [active, animate]);

  return <canvas ref={canvasRef} className="ambient-layer" />;
}
