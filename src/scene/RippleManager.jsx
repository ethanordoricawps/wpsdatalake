import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lake } from '../lake-state.js';
import { LAKE } from '../data/lake.js';
import { PALETTE, rgb01 } from '../data/zones.js';

const POOL = 14;
const MAX_R = LAKE.rz * 1.2; // 2D: t * min*0.2
const LIFE = 1.4; // seconds
const SPARKLE = new THREE.Color(...rgb01(PALETTE.sparkle));

// Pale expanding rings on the water surface, one per active ripple.
export default function RippleManager({ animate = true }) {
  const refs = useRef([]);

  useFrame((_, dt) => {
    // advance + cull
    const rs = lake.ripples;
    for (let i = rs.length - 1; i >= 0; i--) {
      if (animate) rs[i].t += dt / LIFE;
      if (rs[i].t >= 1) rs.splice(i, 1);
    }
    // map active ripples onto the pool
    for (let i = 0; i < POOL; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const r = rs[i];
      if (!r) {
        m.visible = false;
        continue;
      }
      const rad = r.t * MAX_R;
      m.visible = true;
      m.position.set(r.cx, LAKE.y + 0.05, r.cz);
      m.scale.set(rad, rad, rad);
      m.material.opacity = (1 - r.t) * 0.5;
    }
  });

  return (
    <group>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.86, 1.0, 56]} />
          <meshBasicMaterial
            color={SPARKLE}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
