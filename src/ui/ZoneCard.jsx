import { useEffect } from 'react';
import { ZONES, rgbCss, rgbCssLight } from '../data/zones.js';
import { AGENTS } from '../data/agents.js';

const primaryZoneOf = (a) => {
  const ks = Object.keys(a.sources);
  return ks.reduce((best, k) => (a.sources[k] > a.sources[best] ? k : best), ks[0]);
};

// A function-basin briefing: where its data comes from, how it's queried
// (human vs agent), its share of the lake, and which agents draw from it.
// Centered modal, same open/close behaviour as the agent charter but wider and
// visually distinct (zone-colored accent + stat grid). All illustrative.
export default function ZoneCard({ zoneKey, counts, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const z = ZONES[zoneKey];
  if (!z) return null;

  const human = counts[zoneKey] || 0;
  // agents that draw from this basin, with how much of their data they pull here
  const drawing = AGENTS
    .filter((a) => a.sources && a.sources[zoneKey])
    .map((a) => ({ a, pull: a.sources[zoneKey] }))
    .sort((x, y) => y.pull - x.pull);
  // illustrative agent-query volume: scales with how much agent attention the
  // basin gets (more / heavier-weighted agents -> more agent traffic)
  const totalPull = drawing.reduce((s, d) => s + d.pull, 0);
  const agentQ = Math.round(human * totalPull * 0.5);
  const total = human + agentQ;
  const humanPct = total ? Math.round((human / total) * 100) : 100;

  const accent = rgbCss(z.color);
  const accentLight = rgbCssLight(z.color, 0.5);

  return (
    <div className="charter-backdrop" onClick={onClose}>
      <div
        className="zone-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ borderTopColor: accent }}
      >
        <div className="zone-head">
          <span className="zone-dot" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} />
          <div className="zone-head-text">
            <div className="zone-name" style={{ color: accentLight }}>{z.name}</div>
            <div className="zone-sub">Function basin · live</div>
          </div>
          <button className="charter-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="zone-stats">
          <div className="zone-stat">
            <div className="zs-label">Share of lake</div>
            <div className="zs-value">{Math.round(z.v * 100)}<span className="zs-unit">%</span></div>
          </div>
          <div className="zone-stat">
            <div className="zs-label">Total queries</div>
            <div className="zs-value">{total.toLocaleString('en-US')}</div>
          </div>
        </div>

        <div className="zone-block">
          <div className="zb-label">Data sources</div>
          <div className="zone-chips">
            {z.sources.map((s, i) => <span key={i} className="zone-chip">{s}</span>)}
          </div>
        </div>

        <div className="zone-block">
          <div className="zb-label">Human vs agent queries</div>
          <div className="qbar" style={{ '--accent': accentLight }}>
            <div className="qbar-fill" style={{ width: humanPct + '%' }} />
          </div>
          <div className="qbar-legend">
            <span className="ql-human"><b>{human.toLocaleString('en-US')}</b> human · {humanPct}%</span>
            <span className="ql-agent"><b>{agentQ.toLocaleString('en-US')}</b> agent · {100 - humanPct}%</span>
          </div>
        </div>

        <div className="zone-block">
          <div className="zb-label">Agents drawing here</div>
          {drawing.length ? (
            <ul className="zone-agents">
              {drawing.map(({ a, pull }) => (
                <li key={a.id}>
                  <span
                    className="za-dot"
                    style={{ background: rgbCssLight(ZONES[primaryZoneOf(a)].color, 0.5) }}
                  />
                  <span className="za-name">{a.name}{a.edge ? ' · edge case' : ''}</span>
                  <span className="za-creature">{a.creature}</span>
                  <span className="za-pull">{Math.round(pull * 100)}% of its draw</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="zone-empty">No agents draw from this basin yet.</div>
          )}
        </div>

        <div className="charter-foot">Illustrative — pending discovery</div>
      </div>
    </div>
  );
}
