import { useRef } from 'react';
import { ZONES } from '../data/zones.js';

// Per-zone overlay presentation (label/count tints + source lines) — the exact
// values from the 2D file. `cat` marks "(category)" placeholder sources.
const UI = {
  eng: {
    label: '#8FE0F2', count: '#BAEEFF',
    src: [{ t: 'Azure databases' }, { t: 'GitHub repositories' }],
  },
  field: {
    label: '#86EDC4', count: '#A6F1D6',
    src: [{ t: 'Field deployment records' }, { t: 'Site / camera data ', cat: '(category)' }],
  },
  part: {
    label: '#A8BEF2', count: '#C8D6FF',
    src: [{ t: 'Partner records' }, { t: 'Shared program data' }],
  },
  fund: {
    label: '#CDE6A6', count: '#E0F0BC',
    src: [{ t: 'Donor records ', cat: '(category)' }, { t: 'Grants & gifts ledger' }],
  },
};

function SrcLines({ src }) {
  return (
    <>
      {src.map((s, i) => (
        <span key={i}>
          {s.t}
          {s.cat && <span className="cat">{s.cat}</span>}
          {i < src.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function ZoneCard({ k, count, onHover }) {
  const z = ZONES[k];
  const u = UI[k];
  const pct = Math.round(z.v * 100);
  return (
    <div
      className={`ov-zone ${k}`}
      onMouseEnter={() => onHover(k)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="zname" style={{ color: u.label }}>{z.name}</div>
      <div className="zsrc"><SrcLines src={u.src} /></div>
      <div className="zpct">{pct}% of data · illustrative</div>
      <div className="zcount-row">
        <span className="zcount" style={{ color: u.count }}>{count.toLocaleString('en-US')}</span>
        <span className="zq">queries</span>
      </div>
    </div>
  );
}

export default function Overlay({ visible, counts, answer, onHover, onAsk, soundOn, onToggleSound, quality, onToggleQuality }) {
  const inputRef = useRef();
  const submit = () => onAsk(inputRef.current ? inputRef.current.value : '');

  return (
    <div className={`overlay overlay-fade ${visible ? 'show' : ''}`}>
      {/* header */}
      <div className="ov-header">
        <div>
          <h1 className="ov-title">The WPS Data Lake</h1>
          <div className="ov-tagline">one source of truth&nbsp;&nbsp;·&nbsp;&nbsp;four functions&nbsp;&nbsp;·&nbsp;&nbsp;pending discovery</div>
        </div>
        <div className="ov-pill">
          <span className="dot" />
          <span className="lbl">Demo data · illustrative — pending discovery</span>
        </div>
      </div>

      {/* four zone cards */}
      {['eng', 'field', 'part', 'fund'].map((k) => (
        <ZoneCard key={k} k={k} count={counts[k]} onHover={onHover} />
      ))}

      {/* ask the lake */}
      <div className="ov-ask">
        <div className="row">
          <span className="lead">Ask the lake</span>
          <input
            ref={inputRef}
            placeholder="Where does Engineering’s data come from?"
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button onClick={submit} aria-label="Ask">↵</button>
        </div>
        <div className="answer" style={{ color: answer.ok ? '#A7DD8C' : '#BAC4AE' }}>
          {answer.text}
        </div>
      </div>

      {/* sound + quality toggles */}
      <button className="ov-sound" onClick={onToggleSound} aria-label="Toggle sound" title="Toggle ambient sound">
        {soundOn ? '🔊' : '🔈'}
      </button>
      <button
        className="ov-quality"
        onClick={onToggleQuality}
        title="Toggle render quality"
      >
        {quality === 'high' ? 'HD' : 'LO'}
      </button>
    </div>
  );
}
