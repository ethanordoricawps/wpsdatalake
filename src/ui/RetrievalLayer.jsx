import { useEffect, useRef } from 'react';
import { lake } from '../lake-state.js';
import { ZONES, rgbCss } from '../data/zones.js';

const ZK = ['eng', 'field', 'part', 'fund'];
function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}
const toPx = (nx, ny, c) => [c.ox + nx * c.w, c.oy + ny * c.h];
const DRAW = [0.5, 0.55]; // the "spring" where the answer surfaces (normalized frame)
const PARTS = 16;

// Retrieval (RAG) made visible: when a basin is queried, currents stream from
// its records toward the draw point and an answer surfaces there.
export default function RetrievalLayer({ active, centroids, animate = true }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const vw = window.innerWidth, vh = window.innerHeight, c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);
      const [dx, dy] = toPx(DRAW[0], DRAW[1], c);
      const flows = lake.flows;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = flows.length - 1; i >= 0; i--) {
        const f = flows[i];
        if (animate) f.t += 0.011;
        if (f.t >= 1) { flows.splice(i, 1); continue; }
        const ctr = centroids && centroids[f.key];
        if (!ctr) continue;
        const [sx, sy] = toPx(ctr[0], ctr[1], c);
        const col = ZONES[f.key].color;
        // streaming motes from the basin's records -> the draw point
        for (let k = 0; k < PARTS; k++) {
          let p = f.t * 1.5 - k * (1 / PARTS);
          if (p <= 0 || p >= 1) continue;
          const e = p * p * (3 - 2 * p); // ease
          const x = sx + (dx - sx) * e, y = sy + (dy - sy) * e;
          const fade = Math.sin(p * Math.PI);
          ctx.fillStyle = rgbCss(col, 0.5 * fade);
          ctx.beginPath(); ctx.arc(x, y, 2.4 * fade + 0.6, 0, Math.PI * 2); ctx.fill();
        }
        // answer surfacing at the draw point (rises in the back half)
        if (f.t > 0.45) {
          const s = (f.t - 0.45) / 0.55;
          const rad = s * Math.min(c.w, c.h) * 0.05;
          ctx.strokeStyle = `rgba(225,238,205,${(1 - s) * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(dx, dy, rad + 4, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(231,244,210,${(1 - s) * 0.5})`;
          ctx.beginPath(); ctx.arc(dx, dy, 3 * (1 - s) + 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [active, animate, centroids]);

  return <canvas ref={canvasRef} className="retrieval-layer" />;
}
