import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import VideoStage from './ui/VideoStage.jsx';
import AmbientLife from './ui/AmbientLife.jsx';
import LakeOverlay from './ui/LakeOverlay.jsx';
import SectionLabels from './ui/SectionLabels.jsx';
import Overlay from './ui/Overlay.jsx';
import AgentsLayer from './ui/AgentsLayer.jsx';
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
  // ?aerial=1 dev flag: jump straight to the animated aerial (for testing).
  const aerialDebug = PARAMS.has('aerial');
  const [phase, setPhase] = useState(reduced || aerialDebug ? 'aerial' : 'start');
  const [entered, setEntered] = useState(reduced || aerialDebug);
  const [counts, setCounts] = useState(START_COUNTS);
  const [answer, setAnswer] = useState({ text: '', ok: true });
  const [centroids, setCentroids] = useState(null);
  const [agentId, setAgentId] = useState(null); // selected agent (null = none; card hidden)
  const soundOn = false; // audio cut for now (videos stay muted)

  const aerial = phase === 'aerial';

  // a basin was queried: ripple + bump its live count (2D hitZone)
  const hitZone = useCallback((k) => {
    if (!ZONES[k]) return;
    addRipple(k);
    setCounts((c) => ({ ...c, [k]: c[k] + 1 }));
  }, []);

  // auto-life: occasionally ripple a random basin on the aerial view (sparse,
  // so the lake feels alive without constant pinging)
  const hitRef = useRef(hitZone);
  hitRef.current = hitZone;
  useEffect(() => {
    if (reduced || !aerial) return;
    const id = setInterval(() => hitRef.current(ZONE_KEYS[(Math.random() * ZONE_KEYS.length) | 0]), 11000);
    return () => clearInterval(id);
  }, [reduced, aerial]);

  const onHover = useCallback((z) => {
    lake.hovered = z; // read by LakeOverlay's draw loop (no React re-render needed)
    document.body.style.cursor = z ? 'pointer' : 'default';
  }, []);

  const surface = useCallback((z, text) => {
    hitZone(z);
    setAnswer({ text, ok: true, sources: ZONES[z].sources });
  }, [hitZone]);

  // clicking a basin just ripples it (no answer text / source chips — those are
  // reserved for an actual typed question)
  const onQuery = useCallback((z) => {
    if (!ZONES[z]) return;
    hitZone(z);
  }, [hitZone]);

  const onAsk = useCallback((q) => {
    const r = askLake(q);
    if (r.zone) surface(r.zone, r.answer);
    else setAnswer({ text: r.answer, ok: r.ok });
  }, [surface]);

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

      <AmbientLife active={aerial} animate={!reduced} />

      <LakeOverlay active={aerial} animate={!reduced} onHover={onHover} onQuery={onQuery} onReady={setCentroids} />

      <SectionLabels centroids={centroids} counts={counts} visible={aerial} />

      <Overlay visible={aerial} answer={answer} onAsk={onAsk} />

      <AgentsLayer active={aerial} centroids={centroids} selectedId={agentId} onSelect={setAgentId} animate={!reduced} />

      {!entered && <EnterGate onEnter={onEnter} />}
    </>
  );
}
