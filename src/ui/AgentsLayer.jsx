import { useEffect, useRef, useState } from 'react';
import { AGENTS, CHARTER_FIELDS } from '../data/agents.js';
import { ZONES, rgbCss, rgbCssLight } from '../data/zones.js';

function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}
const toPx = (nx, ny, c) => [c.ox + nx * c.w, c.oy + ny * c.h];

// weighted-centroid ("Venn") position of an agent over the basins it draws from:
// an agent reading mostly one section sits deep in it; a cross-function agent
// floats between its sources, nearest the one it pulls the most from.
function vennPos(a, centroids) {
  let x = 0, y = 0, w = 0;
  for (const k in a.sources) {
    const ctr = centroids[k]; if (!ctr) continue;
    const wt = a.sources[k]; x += ctr[0] * wt; y += ctr[1] * wt; w += wt;
  }
  if (!w) return null;
  // optional manual nudge (normalized frame units) to clear an overlap
  return [x / w + (a.nudge ? a.nudge[0] : 0), y / w + (a.nudge ? a.nudge[1] : 0)];
}
const primaryZone = (a) => {
  const ks = Object.keys(a.sources);
  return ks.reduce((best, k) => (a.sources[k] > a.sources[best] ? k : best), ks[0]);
};

export default function AgentsLayer({ active, centroids, selectedId, onSelect, animate = true }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const canvasRef = useRef();
  useEffect(() => {
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  // RAG: slow particle currents drift into the selected agent from each source
  // basin, denser/brighter for the sources it pulls the most data from.
  useEffect(() => {
    if (!active || !centroids) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, t0 = performance.now();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    const draw = (now) => {
      const t = animate ? (now - t0) / 1000 : 0;
      const vw = window.innerWidth, vh = window.innerHeight, c = cover(vw, vh);
      ctx.clearRect(0, 0, vw, vh);
      const a = selectedId && AGENTS.find((x) => x.id === selectedId);
      const ap = a && vennPos(a, centroids);
      if (a && ap) {
        const [ax, ay] = toPx(ap[0], ap[1], c);
        ctx.globalCompositeOperation = 'lighter';
        for (const k in a.sources) {
          const ctr = centroids[k]; if (!ctr) continue;
          const [sx, sy] = toPx(ctr[0], ctr[1], c);
          const col = ZONES[k] ? ZONES[k].color : [180, 200, 180];
          const wt = a.sources[k];
          // faint guide line basin -> agent
          ctx.strokeStyle = rgbCss(col, 0.12);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, ay); ctx.stroke();
          // slow-drifting motes; count + size scale with how much it draws here
          const count = 3 + Math.round(wt * 9);
          for (let i = 0; i < count; i++) {
            const p = (t * 0.1 + i / count) % 1; // slow
            const e = p * p * (3 - 2 * p);
            const x = sx + (ax - sx) * e, y = sy + (ay - sy) * e;
            const fade = Math.sin(p * Math.PI);
            ctx.fillStyle = rgbCss(col, (0.35 + 0.4 * wt) * fade);
            ctx.beginPath(); ctx.arc(x, y, (1.6 + 1.6 * wt) * fade + 0.6, 0, Math.PI * 2); ctx.fill();
          }
        }
        // soft halo where the currents converge on the agent
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
        const pc = ZONES[primaryZone(a)] ? ZONES[primaryZone(a)].color : [210, 225, 190];
        const hr = 15 + 6 * pulse;
        const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, hr);
        g.addColorStop(0, rgbCss(pc, 0.28 + 0.14 * pulse));
        g.addColorStop(1, rgbCss(pc, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ax, ay, hr, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [active, centroids, selectedId, animate]);

  if (!active || !centroids) return null;
  const c = cover(vp.w, vp.h);
  const sel = selectedId ? AGENTS.find((a) => a.id === selectedId) : null;

  return (
    <div className="agents-layer">
      <canvas ref={canvasRef} className="agent-flow" />
      {AGENTS.map((a) => {
        const ap = vennPos(a, centroids); if (!ap) return null;
        const [px, py] = toPx(ap[0], ap[1], c);
        // lift the zone tint well toward white so the dot stays legible on the
        // water — it keeps a hint of its primary color for identity
        const col = rgbCssLight(ZONES[primaryZone(a)].color, 0.58);
        const on = a.id === selectedId;
        return (
          <button
            key={a.id}
            className={`agent-dot ${on ? 'on' : ''} ${a.edge ? 'edge' : ''}`}
            style={{ left: px, top: py, color: col }}
            onClick={() => onSelect(on ? null : a.id)}
          >
            <span className="ad-dot" style={{ background: col, boxShadow: `0 0 0 1.5px rgba(2,10,5,.55), 0 0 18px ${col}` }} />
            <span className="ad-label">
              <span className="ad-name">{a.name}</span>
              <span className="ad-creature">{a.creature}{a.edge ? ' · edge case' : ''}</span>
            </span>
          </button>
        );
      })}
      {sel && <CharterCard key={sel.id} agent={sel} onClose={() => onSelect(null)} />}
    </div>
  );
}

// The charter: a centered modal that fades in over a dimmed screen. Closes on
// its × or by clicking anywhere outside the card.
function CharterCard({ agent, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="charter-backdrop" onClick={onClose}>
      <div className="charter" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="charter-head">
          <span className="charter-dot" style={{ background: rgbCss(ZONES[primaryZone(agent)].color) }} />
          <div className="charter-head-text">
            <div className="charter-name">{agent.name}</div>
            <div className="charter-sub">{agent.creature} · {agent.status}</div>
          </div>
          <button className="charter-close" onClick={onClose} aria-label="Close charter">×</button>
        </div>
        <dl className="charter-fields">
          {CHARTER_FIELDS.map(([key, label]) => (
            <div className="charter-row" key={key}>
              <dt>{label}</dt>
              <dd>{agent[key]}</dd>
            </div>
          ))}
        </dl>
        <div className="charter-foot">Illustrative — pending discovery</div>
      </div>
    </div>
  );
}
