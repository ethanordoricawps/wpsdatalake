import { useEffect, useRef, useState } from 'react';

// The agent's "catch" — a grounded output card with cited sources and the
// governance note that keeps it trustworthy.
function Brief({ brief }) {
  return (
    <div className="scene-brief">
      <div className="sb-kicker">{brief.kicker}</div>
      <div className="sb-title">{brief.title}</div>
      <dl className="sb-lines">
        {brief.lines.map(([k, v]) => (
          <div className="sb-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      {brief.sources && brief.sources.length > 0 && (
        <div className="sb-sources">
          <span className="sb-src-lead">Sources</span>
          {brief.sources.map((s, i) => <span key={i} className="sb-chip">{s}</span>)}
        </div>
      )}
      {brief.guard && (
        <div className="sb-guard"><span className="sb-shield" />{brief.guard}</div>
      )}
    </div>
  );
}

// Runs a scenario: each step ripples a basin and/or spotlights an agent (which
// shows it drawing from its sources), narrates the beat, and surfaces the brief.
export default function ScenarioPlayer({ scenario, onRipple, onSpotlight, onExit }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef();

  // restart when a new scenario is launched
  useEffect(() => { setIdx(0); }, [scenario]);

  // apply the current step's effects, then schedule the next beat
  useEffect(() => {
    const step = scenario.steps[idx];
    if (!step) return;
    if (step.ripple) onRipple(step.ripple);
    onSpotlight(step.spotlight || null);
    clearTimeout(timer.current);
    if (idx < scenario.steps.length - 1) {
      timer.current = setTimeout(() => setIdx((i) => i + 1), step.dur + 1500);
    }
    return () => clearTimeout(timer.current);
  }, [scenario, idx, onRipple, onSpotlight]);

  // drop the spotlight when the player unmounts
  useEffect(() => () => onSpotlight(null), [onSpotlight]);

  const step = scenario.steps[idx];
  const last = idx === scenario.steps.length - 1;

  return (
    <div className="scene-hud">
      <div className="scene-caption">
        <div className="sc-head">
          <span className="sc-kicker">{scenario.title}</span>
          <button className="sc-end" onClick={onExit} aria-label="End walkthrough">End ✕</button>
        </div>
        <p className="sc-text">{step.caption}</p>
        <div className="sc-foot">
          <div className="sc-dots">
            {scenario.steps.map((s, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
          </div>
          <div className="sc-nav">
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous">‹</button>
            <button onClick={() => setIdx((i) => Math.min(scenario.steps.length - 1, i + 1))} disabled={last} aria-label="Next">›</button>
          </div>
        </div>
      </div>
      {step.brief && <Brief brief={step.brief} />}
    </div>
  );
}
