import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoStage from './ui/VideoStage.jsx';
import LakeOverlay from './ui/LakeOverlay.jsx';
import SectionLabels from './ui/SectionLabels.jsx';
import Overlay from './ui/Overlay.jsx';
import EnterGate from './ui/EnterGate.jsx';
import { addRipple, lake } from './lake-state.js';
import { START_COUNTS, ZONES, ZONE_KEYS, askLake } from './data/zones.js';

// Archived real-time 3D scene — lazy so its heavy three.js bundle only loads on ?mode=3d
const App3D = lazy(() => import('./App3D.jsx'));
const PARAMS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

export default function App() {
  // ?mode=3d falls back to the archived real-time 3D scene
  if (PARAMS.get('mode') === '3d') return <Suspense fallback={null}><App3D /></Suspense>;

  const [reduced] = useState(
    () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // phases: start (ground loop) -> swoop -> aerial. reduced jumps to aerial.
  const [phase, setPhase] = useState(reduced ? 'aerial' : 'start');
  const [entered, setEntered] = useState(reduced);
  const [counts, setCounts] = useState(START_COUNTS);
  const [answer, setAnswer] = useState({ text: '', ok: true });
  const [centroids, setCentroids] = useState(null);
  const soundOn = false; // audio cut for now (videos stay muted)

  const aerial = phase === 'aerial';

  // a basin was queried: ripple + bump its live count (2D hitZone)
  const hitZone = useCallback((k) => {
    if (!ZONES[k]) return;
    addRipple(k);
    setCounts((c) => ({ ...c, [k]: c[k] + 1 }));
  }, []);

  // auto-life: every ~2.2s ripple a random basin once on the aerial view
  const hitRef = useRef(hitZone);
  hitRef.current = hitZone;
  useEffect(() => {
    if (reduced || !aerial) return;
    const id = setInterval(() => hitRef.current(ZONE_KEYS[(Math.random() * ZONE_KEYS.length) | 0]), 2200);
    return () => clearInterval(id);
  }, [reduced, aerial]);

  const onHover = useCallback((z) => {
    lake.hovered = z; // read by LakeOverlay's draw loop (no React re-render needed)
    document.body.style.cursor = z ? 'pointer' : 'default';
  }, []);

  const onQuery = useCallback((z) => {
    if (!ZONES[z]) return;
    hitZone(z);
    const Z = ZONES[z];
    setAnswer({
      text: `${Z.name} draws from ${Z.sources[0]} and ${Z.sources[1]}.  Illustrative — pending discovery.`,
      ok: true,
    });
  }, [hitZone]);

  const onAsk = useCallback((q) => {
    const r = askLake(q);
    if (r.zone) hitZone(r.zone);
    setAnswer({ text: r.answer, ok: r.ok });
  }, [hitZone]);

  const onEnter = useCallback(() => {
    setEntered(true);
    setPhase('swoop');
  }, []);

  return (
    <>
      <VideoStage
        phase={phase}
        entered={entered}
        soundOn={soundOn}
        onSwoopEnd={() => setPhase('aerial')}
      />

      <LakeOverlay active={aerial} animate={!reduced} onHover={onHover} onQuery={onQuery} onReady={setCentroids} />

      <SectionLabels centroids={centroids} counts={counts} visible={aerial} />

      <Overlay visible={aerial} answer={answer} onAsk={onAsk} />

      {!entered && <EnterGate onEnter={onEnter} />}
    </>
  );
}
