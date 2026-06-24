import { useRef } from 'react';

// HTML chrome over the lake: header (title + demo-data pill), the "Ask the
// lake" box, and (3D fallback only) an HD/LO quality toggle. The per-section
// labels live on the lake itself (SectionLabels); legibility scrims sit behind.
export default function Overlay({ visible, answer, onAsk, quality, onToggleQuality }) {
  const inputRef = useRef();
  const submit = () => onAsk(inputRef.current ? inputRef.current.value : '');

  return (
    <div className={`overlay overlay-fade ${visible ? 'show' : ''}`}>
      {/* legibility scrims (behind text, any background) */}
      <div className="ov-scrim-top" />
      <div className="ov-scrim-bottom" />

      {/* header */}
      <header className="ov-header">
        <div>
          <h1 className="ov-title">The WPS Data Lake</h1>
          <div className="ov-tagline">one source of truth&nbsp;&nbsp;·&nbsp;&nbsp;four functions&nbsp;&nbsp;·&nbsp;&nbsp;pending discovery</div>
        </div>
        <div className="ov-pill">
          <span className="dot" />
          <span className="lbl">Demo data · illustrative — pending discovery</span>
        </div>
      </header>

      {/* ask the lake */}
      <div className="ov-ask">
        <div className="row">
          <label className="lead" htmlFor="ask-input">Ask the lake</label>
          <input
            id="ask-input"
            ref={inputRef}
            aria-label="Ask the lake — which function a data source belongs to, or where a function's data lives"
            placeholder="Where does Engineering’s data come from?"
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button onClick={submit} aria-label="Ask the lake">↵</button>
        </div>
        <div className="answer" role="status" aria-live="polite" style={{ color: answer.ok ? '#A7DD8C' : '#BAC4AE' }}>
          {answer.text}
        </div>
      </div>

      {onToggleQuality && (
        <button className="ov-quality" onClick={onToggleQuality} title="Toggle render quality">
          {quality === 'high' ? 'HD' : 'LO'}
        </button>
      )}
    </div>
  );
}
