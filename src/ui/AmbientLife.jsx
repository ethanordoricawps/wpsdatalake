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

    // fog banks: normalized-frame band over the water (y ~0.28..0.62), drifting
    const fog = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random(), y: 0.3 + (i / 6) * 0.32 + (Math.random() - 0.5) * 0.05,
      w: 0.5 + Math.random() * 0.5, h: 0.07 + Math.random() * 0.06,
      speed: (0.004 + Math.random() * 0.006) * (i % 2 ? 1 : -1),
      a: 0.05 + Math.random() * 0.05,
    }));

    // birds
    const birds = [];
    const spawnFlock = (single) => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const n = single ? 1 : 4 + (Math.random() * 7 | 0);
      const baseY = 0.02 + Math.random() * 0.06;       // the bright sky strip up top
      const baseX = dir > 0 ? -0.08 : 1.08;
      const speed = 0.085 + Math.random() * 0.05;
      const size = 9 + Math.random() * 7;
      for (let i = 0; i < n; i++) {
        birds.push({
          x: baseX - dir * (i * 0.018) - dir * (i % 2) * 0.01,  // loose V
          y: baseY + i * 0.012 * (i % 2 ? 1 : -1) + (single ? 0 : 0.004 * i),
          dir, speed, size: size * (single ? 1.1 : 1), flap: Math.random() * Math.PI * 2,
          flapSpeed: 6 + Math.random() * 3,
        });
      }
    };
    let nextFlock = 1.5, nextSingle = 4; // seconds; first flock soon so it's visible

    const drawBird = (b, sx, sy, t) => {
      const wing = Math.sin(t * b.flapSpeed + b.flap) * 0.5 + 0.5; // 0..1
      const span = b.size, lift = b.size * (0.25 + wing * 0.5);
      ctx.beginPath();
      ctx.moveTo(sx - span, sy + lift * 0.3);
      ctx.quadraticCurveTo(sx - span * 0.3, sy - lift, sx, sy);
      ctx.quadraticCurveTo(sx + span * 0.3, sy - lift, sx + span, sy + lift * 0.3);
      ctx.strokeStyle = 'rgba(22,30,24,0.78)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const vw = window.innerWidth, vh = window.innerHeight, c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);

      // ---- fog banks ----
      fog.forEach((f) => {
        if (animate) { f.x += f.speed * dt; if (f.x > 1.3) f.x = -0.3; if (f.x < -0.3) f.x = 1.3; }
        const cx = c.ox + f.x * c.w, cy = c.oy + f.y * c.h;
        const rw = f.w * c.w, rh = f.h * c.h;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw / 2);
        g.addColorStop(0, `rgba(232,240,232,${f.a})`);
        g.addColorStop(1, 'rgba(232,240,232,0)');
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(1, rh / rw); ctx.translate(-cx, -cy);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, rw / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // ---- birds ----
      if (animate) {
        nextFlock -= dt; nextSingle -= dt;
        if (nextFlock <= 0) { spawnFlock(false); nextFlock = 14 + Math.random() * 12; }
        if (nextSingle <= 0) { spawnFlock(true); nextSingle = 7 + Math.random() * 8; }
      }
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        if (animate) b.x += b.dir * b.speed * dt;
        if (b.x < -0.15 || b.x > 1.15) { birds.splice(i, 1); continue; }
        // gentle bob
        const sy = c.oy + (b.y + Math.sin(t * 0.6 + b.flap) * 0.004) * c.h;
        drawBird(b, c.ox + b.x * c.w, sy, t);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [active, animate]);

  return <canvas ref={canvasRef} className="ambient-layer" />;
}
