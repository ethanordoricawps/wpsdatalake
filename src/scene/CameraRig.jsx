import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { intro, T } from '../intro.js';

// Cinematic intro: forest interior -> swoop up through canopy -> flatten to the
// aerial framing -> hold (idle drift). One timeline driver, cubic-eased.
// Keyframes are [time, position, lookAt-target] in world units.
const KEYS = [
  { t: 0,           pos: [4.0, 2.4, 25.0], tgt: [0, 4.0, 13.0] }, // low, inside the canopy, ~horizontal
  { t: T.forestEnd, pos: [2.6, 6.0, 23.5], tgt: [0, 2.5, 9.0] },  // begin lifting
  { t: T.swoopEnd,  pos: [1.0, 19.0, 22.0], tgt: [0, 0.0, 5.0] }, // cleared the treeline, pitching down
  { t: T.settleEnd, pos: [0.0, 25.0, 19.0], tgt: [0, 0, 0] },     // aerial settle (final framing)
  { t: T.textEnd,   pos: [0.0, 25.0, 19.0], tgt: [0, 0, 0] },     // locked
];

// final framing (also the reduced-motion / idle anchor)
export const AERIAL = { pos: new THREE.Vector3(0, 25, 19), tgt: new THREE.Vector3(0, 0, 0) };

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const v = (a) => new THREE.Vector3(a[0], a[1], a[2]);

function sampleTimeline(t) {
  if (t <= KEYS[0].t) return { pos: v(KEYS[0].pos), tgt: v(KEYS[0].tgt) };
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = easeInOutCubic((t - a.t) / (b.t - a.t));
      return {
        pos: v(a.pos).lerp(v(b.pos), f),
        tgt: v(a.tgt).lerp(v(b.tgt), f),
      };
    }
  }
  const last = KEYS[KEYS.length - 1];
  return { pos: v(last.pos), tgt: v(last.tgt) };
}

// Handheld camera shake, strongest in the forest/swoop and faded out by swoopEnd.
function handheld(t, out) {
  const fade = Math.max(0, 1 - t / T.swoopEnd);
  if (fade <= 0) return;
  const a = fade * 0.22;
  out.x += Math.sin(t * 1.7) * a + Math.sin(t * 3.3 + 1.2) * a * 0.4;
  out.y += Math.sin(t * 2.1 + 0.7) * a * 0.8;
  out.z += Math.cos(t * 1.3 + 2.0) * a * 0.5;
}

export default function CameraRig({ onDone, autoStart = false }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 4, 13));
  const firedDone = useRef(false);
  const startStamped = useRef(false);

  useFrame((state) => {
    // autoStart (tests / ?auto) flips the gate-controlled flag for us
    if (autoStart && !intro.started && !intro.reduced && !intro.done) {
      intro.started = true;
    }
    // stamp the start time on the first frame after the gate fires
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

    // keep the timeline clock advancing even after handoff, so SkyText can
    // finish its fade-out and any time-driven UI stays in sync
    const t = state.clock.elapsedTime - intro.startTime;
    intro.t = t;

    if (intro.done) return; // OrbitControls own the camera now

    const { pos, tgt } = sampleTimeline(t);

    // gentle idle drift once settled (before handoff), so the hold isn't frozen
    if (t > T.settleEnd) {
      const d = t - T.settleEnd;
      pos.x += Math.sin(d * 0.18) * 0.5;
      pos.y += Math.sin(d * 0.13 + 1.0) * 0.25;
      tgt.x += Math.sin(d * 0.16) * 0.2;
    }

    handheld(t, pos);

    camera.position.copy(pos);
    target.current.copy(tgt);
    camera.lookAt(target.current);

    if (t >= T.textEnd && !firedDone.current) {
      firedDone.current = true;
      intro.done = true;
      onDone?.();
    }
  });

  return null;
}
