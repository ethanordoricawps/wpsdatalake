import { useEffect, useState } from 'react';
import { AGENTS, CHARTER_FIELDS } from '../data/agents.js';
import { ZONES, rgbCss } from '../data/zones.js';

function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}

// Agents as creatures of the lake: a marker over each one's territory basin +
// a charter panel for the selected agent (default = the edge-case Ranger Dispatch).
export default function AgentsLayer({ active, centroids, selectedId, onSelect }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  if (!active || !centroids) return null;

  const c = cover(vp.w, vp.h);
  const sel = AGENTS.find((a) => a.id === selectedId) || AGENTS[0];

  return (
    <div className="agents-layer">
      {/* markers on territory basins */}
      {AGENTS.map((a) => {
        const ctr = centroids[a.zone];
        if (!ctr) return null;
        const left = c.ox + ctr[0] * c.w, top = c.oy + ctr[1] * c.h;
        const col = rgbCss(ZONES[a.zone].color);
        const on = a.id === sel.id;
        return (
          <button
            key={a.id}
            className={`agent-marker ${on ? 'on' : ''} ${a.edge ? 'edge' : ''}`}
            style={{ left, top }}
            onClick={() => onSelect(a.id)}
          >
            <span className="am-dot" style={{ background: col, boxShadow: `0 0 12px ${col}` }} />
            <span className="am-label">
              <span className="am-name">{a.name}</span>
              <span className="am-creature">{a.creature}{a.edge ? ' · edge case' : ''}</span>
            </span>
          </button>
        );
      })}

      {/* charter panel for the selected agent */}
      <div className="charter">
        <div className="charter-head">
          <span className="charter-dot" style={{ background: rgbCss(ZONES[sel.zone].color) }} />
          <div>
            <div className="charter-name">{sel.name}</div>
            <div className="charter-sub">{sel.creature} · {sel.status}</div>
          </div>
        </div>
        <dl className="charter-fields">
          {CHARTER_FIELDS.map(([key, label]) => (
            <div className="charter-row" key={key}>
              <dt>{label}</dt>
              <dd>{sel[key]}</dd>
            </div>
          ))}
        </dl>
        <div className="charter-foot">Illustrative — pending discovery</div>
      </div>
    </div>
  );
}
