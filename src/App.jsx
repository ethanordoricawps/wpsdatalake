import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import VideoStage from './ui/VideoStage.jsx';
import AmbientLife from './ui/AmbientLife.jsx';
import LakeOverlay from './ui/LakeOverlay.jsx';
import SectionLabels from './ui/SectionLabels.jsx';
import Overlay from './ui/Overlay.jsx';
import AgentsLayer from './ui/AgentsLayer.jsx';
import ZoneCard from './ui/ZoneCard.jsx';
import Legend from './ui/Legend.jsx';
import ScenarioLauncher from './ui/ScenarioLauncher.jsx';
import ScenarioPlayer from './ui/ScenarioPlayer.jsx';
import EnterGate from './ui/EnterGate.jsx';
import { addRipple, clearRipples, lake } from './lake-state.js';
import { START_COUNTS, ZONES, ZONE_KEYS, askLake } from './data/zones.js';
import { SCENARIOS } from './data/scenarios.js';

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
  const [zoneCard, setZoneCard] = useState(null); // function basin whose briefing is open
  const [scene, setScene] = useState(() => {
    const s = PARAMS.get('scene');
    return s && SCENARIOS.some((x) => x.id === s) ? s : null;
  });
  const [spotlightAgent, setSpotlightAgent] = useState(null); // agent lit by a running scenario
  const soundOn = false; // audio cut for now (videos stay muted)

  const aerial = phase === 'aerial';
  const runningScene = scene ? SCENARIOS.find((s) => s.id === scene) : null;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // a basin was queried: ripple + bump its live count (2D hitZone)
  const hitZone = useCallback((k) => {
    if (!ZONES[k]) return;
    addRipple(k);
    setCounts((c) => ({ ...c, [k]: c[k] + 1 }));
  }, []);

  // auto-life: occasionally ripple a random basin so the lake feels alive —
  // but completely halted during a walkthrough so it can't interfere
  const hitRef = useRef(hitZone);
  hitRef.current = hitZone;
  useEffect(() => {
    if (reduced || !aerial || scene) return;
    const ping = () => hitRef.current(ZONE_KEYS[(Math.random() * ZONE_KEYS.length) | 0]);
    const first = setTimeout(ping, 1800); // one soon after the lake appears
    const id = setInterval(ping, 9000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [reduced, aerial, scene]);

  const onHover = useCallback((z) => {
    lake.hovered = z; // read by LakeOverlay's draw loop (no React re-render needed)
    document.body.style.cursor = z ? 'pointer' : 'default';
  }, []);

  const surface = useCallback((z, text) => {
    hitZone(z);
    setAnswer({ text, ok: true, sources: ZONES[z].sources });
  }, [hitZone]);

  // clicking a basin opens its briefing card (suppressed during a walkthrough)
  const onQuery = useCallback((z) => {
    if (sceneRef.current || !ZONES[z]) return;
    setAgentId(null);
    setZoneCard(z);
  }, []);

  // selecting an agent closes any open basin card (suppressed during a walkthrough)
  const onSelectAgent = useCallback((id) => {
    if (sceneRef.current) return;
    setZoneCard(null);
    setAgentId(id);
  }, []);

  // walkthrough ripple: bolder than a normal click so the data event reads clearly
  const sceneRipple = useCallback((k) => {
    if (!ZONES[k]) return;
    addRipple(k, 2.4);
    setCounts((c) => ({ ...c, [k]: c[k] + 1 }));
  }, []);

  const startScene = useCallback((id) => {
    clearRipples(); // drop any in-flight auto-ping so it doesn't linger into the walkthrough
    setAgentId(null); setZoneCard(null); setSpotlightAgent(null); setScene(id);
  }, []);
  const stopScene = useCallback(() => {
    setScene(null); setSpotlightAgent(null);
  }, []);

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

      <AgentsLayer active={aerial} centroids={centroids} selectedId={agentId} spotlightId={spotlightAgent} onSelect={onSelectAgent} animate={!reduced} />

      {aerial && zoneCard && <ZoneCard zoneKey={zoneCard} counts={counts} onClose={() => setZoneCard(null)} />}

      <Legend visible={aerial && !runningScene} />

      {aerial && !runningScene && <ScenarioLauncher visible onStart={startScene} />}

      {aerial && runningScene && (
        <ScenarioPlayer scenario={runningScene} onRipple={sceneRipple} onSpotlight={setSpotlightAgent} onExit={stopScene} />
      )}

      {!entered && <EnterGate onEnter={onEnter} />}
    </>
  );
}
