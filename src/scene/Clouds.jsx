import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE } from '../data/lake.js';

// Soft radial-gradient puff texture (generated once, no external asset).
function makeCloudTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(220,232,210,0.9)');
  g.addColorStop(0.5, 'rgba(200,216,190,0.35)');
  g.addColorStop(1, 'rgba(200,216,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const N = 7;

// Slow lateral drift above the canopy; wraps around to re-spawn.
export default function Clouds({ animate = true }) {
  const tex = useMemo(makeCloudTexture, []);
  const refs = useRef([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: ((i / N) * 2 - 1) * LAKE.rx * 2.2,
        y: 14 + (i % 3) * 3.5,
        z: -LAKE.rz * 1.6 + (i * 2.1) % (LAKE.rz * 3.2),
        scale: 9 + (i % 4) * 4,
        speed: 0.25 + (i % 5) * 0.06,
        op: 0.1 + (i % 3) * 0.05,
      })),
    [],
  );

  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = seeds[i];
      const span = LAKE.rx * 4.4;
      let x = s.x + t * s.speed;
      x = ((((x + span / 2) % span) + span) % span) - span / 2; // wrap
      m.position.x = x;
    });
  });

  return (
    <group>
      {seeds.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[s.x, s.y, s.z]}
          scale={[s.scale * 1.7, s.scale, 1]}
        >
          <spriteMaterial
            map={tex}
            transparent
            opacity={s.op}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </sprite>
      ))}
    </group>
  );
}
