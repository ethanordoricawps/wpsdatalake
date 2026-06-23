import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { intro, T } from '../intro.js';

// Cinematic intro: forest interior -> swoop up through canopy -> flatten to the
// aerial framing -> hold (idle drift). The whole move is ONE continuous spline
// driven by a single global ease, so velocity never drops to zero at a waypoint
// (which is what made the per-segment version feel jerky).
const KEYS = [
  { pos: [4.0, 2.4, 25.0], tgt: [0, 4.0, 13.0] }, // low, inside the canopy, ~horizontal
  { pos: [2.6, 6.0, 23.5], tgt: [0, 2.5, 9.0] },  // begin lifting
  { pos: [1.0, 19.0, 22.0], tgt: [0, 0.0, 5.0] }, // cleared the treeline, pitching down
  { pos: [0.0, 25.0, 19.0], tgt: [0, 0, 0] },     // aerial settle (final framing)
];

// final framing (also the reduced-motion / idle anchor)
export const AERIAL = { pos: new THREE.Vector3(0, 25, 19), tgt: new THREE.Vector3(0, 0, 0) };

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const v = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// A gentle low-frequency handheld drift (not a shake), faded out by the swoop end.
function handheld(t, out) {
  const fade = Math.max(0, 1 - t / T.swoopEnd);
  if (fade <= 0) return;
  const a = fade * 0.08;
  out.x += Math.sin(t * 0.6) * a + Math.sin(t * 0.95 + 1.2) * a * 0.5;
  out.y += Math.sin(t * 0.72 + 0.7) * a * 0.7;
}

export default function CameraRig({ onDone, autoStart = false }) {
  const { camera } = useThree();
  const firedDone = useRef(false);
  const startStamped = useRef(false);

  // continuous centripetal splines through the waypoints (no overshoot/cusps)
  const { posCurve, tgtCurve } = useMemo(() => {
    const mk = (key) =>
      new THREE.CatmullRomCurve3(KEYS.map((k) => v(k[key])), false, 'centripetal', 0.5);
    return { posCurve: mk('pos'), tgtCurve: mk('tgt') };
  }, []);

  const pos = useRef(new THREE.Vector3());
  const tgt = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (autoStart && !intro.started && !intro.reduced && !intro.done) {
      intro.started = true;
    }
    if (intro.started && !startStamped.current && !intro.reduced) {
      startStamped.current = true;
      intro.startTime = state.clock.elapsedTime;
    }

    // Reduced motion: snap to the aerial end-state once, no swoop.
    if (intro.reduced) {
      camera.position.copy(AERIAL.pos);
      camera.lookAt(AERIAL.tgt);
      if (!firedDone.current) {
        firedDone.current = true;
        intro.done = true;
        onDone?.();
      }
      return;
    }

    if (!intro.started) return; // EnterGate hasn't fired yet

    // keep the timeline clock advancing even after handoff (SkyText fade-out etc.)
    const t = state.clock.elapsedTime - intro.startTime;
    intro.t = t;
    if (intro.done) return; // OrbitControls own the camera now

    // single global ease across the whole swoop -> one continuous move
    const g = easeInOutCubic(THREE.MathUtils.clamp(t / T.settleEnd, 0, 1));
    posCurve.getPoint(g, pos.current);
    tgtCurve.getPoint(g, tgt.current);

    // gentle idle drift once settled (before handoff), so the hold isn't frozen
    if (t > T.settleEnd) {
      const d = t - T.settleEnd;
      pos.current.x += Math.sin(d * 0.18) * 0.5;
      pos.current.y += Math.sin(d * 0.13 + 1.0) * 0.25;
      tgt.current.x += Math.sin(d * 0.16) * 0.2;
    }

    handheld(t, pos.current);

    camera.position.copy(pos.current);
    camera.lookAt(tgt.current);

    if (t >= T.textEnd && !firedDone.current) {
      firedDone.current = true;
      intro.done = true;
      onDone?.();
    }
  });

  return null;
}
