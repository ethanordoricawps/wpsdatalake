import { useState } from 'react';
import { SCENARIOS } from '../data/scenarios.js';

// Quiet launcher to test the walkthrough flows (also reachable via ?scene=<id>).
export default function ScenarioLauncher({ visible, onStart }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`scene-launcher ${visible ? 'show' : ''}`}>
      {open && (
        <div className="sl-list">
          {SCENARIOS.map((s) => (
            <button key={s.id} className="sl-item" onClick={() => { onStart(s.id); setOpen(false); }}>
              <span className="sl-title">{s.title}</span>
              <span className="sl-agent">{s.agent}</span>
            </button>
          ))}
        </div>
      )}
      <button className="sl-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ▷ Walkthroughs
      </button>
    </div>
  );
}
