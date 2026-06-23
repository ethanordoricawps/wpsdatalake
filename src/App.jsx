import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './scene/Scene.jsx';
import Overlay from './ui/Overlay.jsx';
import EnterGate from './ui/EnterGate.jsx';
import { intro, resetIntro } from './intro.js';
import { addRipple, lake } from './lake-state.js';
import { startAmbient, setMuted } from './audio.js';
import { START_COUNTS, ZONES, ZONE_KEYS, askLake } from './data/zones.js';
import { zoneAt } from './data/lake.js';

// Camera starts low in the forest interior; CameraRig drives the swoop to aerial.
const CAMERA = { position: [4, 2.4, 25], fov: 45, near: 0.1, far: 200 };
const AUTO = typeof location !== 'undefined' && new URLSearchParams(location.search).has('auto');

export default function App() {
  const [reduced] = useState(
    () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [counts, setCounts] = useState(START_COUNTS);
  const [done, setDone] = useState(reduced); // reduced motion starts "settled"
  const [, setHovered] = useState(null);
  const [answer, setAnswer] = useState({ text: '', ok: true });
  const [entered, setEntered] = useState(AUTO);
  const [soundOn, setSoundOn] = useState(true);
  const [quality, setQuality] = useState('high');

  useEffect(() => {
    resetIntro(reduced);
  }, [reduced]);

  // central "a basin was queried": ripple + bump its live count (2D hitZone)
  const hitZone = useCallback((k) => {
    if (!ZONES[k]) return;
    addRipple(k);
    setCounts((c) => ({ ...c, [k]: c[k] + 1 }));
  }, []);

  // auto-life: every ~2.2s ripple a random basin (the 2D simQuery)
  const hitRef = useRef(hitZone);
  hitRef.current = hitZone;
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (!done) return;
      hitRef.current(ZONE_KEYS[(Math.random() * ZONE_KEYS.length) | 0]);
    }, 2200);
    return () => clearInterval(id);
  }, [reduced, done]);

  const hoverZone = useCallback((z) => {
    lake.hovered = z;
    setHovered(z);
    document.body.style.cursor = z ? 'pointer' : 'default';
  }, []);

  // pointer interaction on the water (only after the intro settles)
  const waterHandlers = useMemo(
    () => ({
      onPointerMove: (e) => { if (done) hoverZone(zoneAt(e.point.x, e.point.z)); },
      onPointerOut: () => hoverZone(null),
      onClick: (e) => {
        if (!done) return;
        const z = zoneAt(e.point.x, e.point.z);
        if (!z) return;
        hitZone(z);
        const Z = ZONES[z];
        setAnswer({
          text: `${Z.name} draws from ${Z.sources[0]} and ${Z.sources[1]}.  Illustrative — pending discovery.`,
          ok: true,
        });
      },
    }),
    [done, hoverZone, hitZone],
  );

  const onAsk = useCallback((q) => {
    const r = askLake(q);
    if (r.zone) hitZone(r.zone);
    setAnswer({ text: r.answer, ok: r.ok });
  }, [hitZone]);

  const onEnter = useCallback(() => {
    setEntered(true);
    intro.started = true;
    if (soundOn) startAmbient();
  }, [soundOn]);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const next = !s;
      if (next) startAmbient();
      setMuted(!next);
      return next;
    });
  }, []);

  return (
    <>
      <Canvas
        shadows
        flat
        camera={CAMERA}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={quality === 'high' ? [1, 2] : 1}
      >
        <Scene
          animate={!reduced}
          reduced={reduced}
          autoStart={AUTO}
          done={done}
          quality={quality}
          onIntroDone={() => setDone(true)}
          waterHandlers={waterHandlers}
        />
      </Canvas>

      <Overlay
        visible={done && entered}
        counts={counts}
        answer={answer}
        onHover={hoverZone}
        onAsk={onAsk}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        quality={quality}
        onToggleQuality={() => setQuality((q) => (q === 'high' ? 'low' : 'high'))}
      />

      {!entered && <EnterGate onEnter={onEnter} />}
    </>
  );
}
