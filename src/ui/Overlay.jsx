import { useEffect, useRef, useState } from 'react';
import About from './About.jsx';

// HTML chrome over the lake: header (title + demo-data pill), the "Ask the
// lake" box, and (3D fallback only) an HD/LO quality toggle. The per-section
// labels live on the lake itself (SectionLabels); legibility scrims sit behind.
export default function Overlay({ visible, answer, onAsk, showAsk = true, quality, onToggleQuality }) {
  const inputRef = useRef();
  const submit = () => {
    if (!inputRef.current) return;
    onAsk(inputRef.current.value);
    inputRef.current.value = ''; // clear the bar after sending
    inputRef.current.blur();     // deselect so it's no longer the active field
  };

  // the answer/chips float above the (static) bar: fade in quickly, hold, then
  // fade out a touch slower (durations live in CSS, per show/hide state)
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => {
    if (!answer.text) { setShowAnswer(false); return; }
    setShowAnswer(true);
    const id = setTimeout(() => setShowAnswer(false), 5000);
    return () => clearTimeout(id);
  }, [answer]);

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
        <div className="ov-head-right">
          <About />
          <div className="ov-pill">
            <span className="dot" />
            <span className="lbl">Demo data · illustrative — pending discovery</span>
          </div>
        </div>
      </header>

      {/* ask the lake — the bar stays put; the answer floats above it */}
      <div className="ov-ask" style={{ display: showAsk ? 'flex' : 'none' }}>
        <div className={`ov-answer ${showAnswer ? 'show' : ''}`} role="status" aria-live="polite">
          <div className="answer" style={{ color: answer.ok ? '#A7DD8C' : '#BAC4AE' }}>
            {answer.text}
          </div>
          {answer.sources && answer.sources.length > 0 && (
            <div className="ov-sources">
              <span className="src-lead">Sources</span>
              {answer.sources.map((s, i) => (
                <span key={i} className="src-chip">{s}</span>
              ))}
            </div>
          )}
        </div>
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
      </div>

      {onToggleQuality && (
        <button className="ov-quality" onClick={onToggleQuality} title="Toggle render quality">
          {quality === 'high' ? 'HD' : 'LO'}
        </button>
      )}
    </div>
  );
}
