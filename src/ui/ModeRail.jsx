// The journey switcher: The Lake (substrate) -> Retrieval (RAG) -> Agents.
// Each mode shows a one-line caption tying it to the AI roadmap.
export const MODES = [
  { id: 'lake', label: 'The Lake', step: 'Substrate', caption: 'One consolidated, governed lake — four functions, one source of truth.' },
  { id: 'retrieve', label: 'Retrieval', step: 'RAG', caption: 'Ask the lake — answers are drawn from real records, with cited sources.' },
  { id: 'agents', label: 'Agents', step: 'Edge → scale', caption: 'Creatures with charters: one narrow agent, proven at the edge, then scaled.' },
];

export default function ModeRail({ mode, setMode, visible }) {
  const active = MODES.find((m) => m.id === mode) || MODES[0];
  return (
    <div className={`mode-wrap ${visible ? 'show' : ''}`}>
      <div className="mode-caption">{active.caption}</div>
      <div className="mode-rail" role="tablist" aria-label="Data lake journey">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={m.id === mode}
            className={`mode-seg ${m.id === mode ? 'on' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span className="seg-label">{m.label}</span>
            <span className="seg-step">{m.step}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
