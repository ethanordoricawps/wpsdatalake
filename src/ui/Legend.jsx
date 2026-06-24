// A quiet, always-on key (bottom-left) so a first-time viewer can read the scene.
const ITEMS = [
  ['zone', 'Basin — a WPS function'],
  ['dot', 'Dot — an AI agent (blended source color)'],
  ['flow', 'Motes — retrieval (hover a dot)'],
  ['health', 'Card status — basin health'],
];

export default function Legend({ visible }) {
  return (
    <div className={`legend ${visible ? 'show' : ''}`}>
      <div className="legend-title">Key</div>
      {ITEMS.map(([k, text]) => (
        <div className="legend-row" key={k}>
          <span className={`legend-ico ico-${k}`} />
          <span className="legend-text">{text}</span>
        </div>
      ))}
    </div>
  );
}
