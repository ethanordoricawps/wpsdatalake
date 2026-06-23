import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELLS, feedToWorld, LAKE } from '../data/lake.js';
import { ZONE_KEYS, ZONES, rgb01 } from '../data/zones.js';

// soft circular mote texture (runtime-generated, no external asset)
function makeMote() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  return t;
}

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// Inflow: sparse motes drift from each ZONE.feed shoreline point to the basin
// center, tinted ZONE.color, fading in/out on a sine curve (the 2D inflow).
export default function Inflow({ animate = true, quality = 'high' }) {
  const tex = useMemo(makeMote, []);
  const perZone = quality === 'low' ? 4 : 8;

  const { geometry, parts } = useMemo(() => {
    const parts = [];
    ZONE_KEYS.forEach((k) => {
      const [fx, fz] = feedToWorld(ZONES[k].feed);
      const cell = CELLS.cells[k];
      for (let i = 0; i < perZone; i++) {
        parts.push({
          from: new THREE.Vector2(fx, fz),
          to: new THREE.Vector2(cell.cx, cell.cz),
          col: rgb01(ZONES[k].color),
          p: (i / perZone + Math.random() * 0.25) % 1,
          speed: 0.05 + Math.random() * 0.04,
          rot: Math.random() * Math.PI,
        });
      }
    });
    const n = parts.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry, parts };
  }, [perZone]);

  const ref = useRef();

  useFrame((_, dt) => {
    const pos = geometry.attributes.position.array;
    const col = geometry.attributes.color.array;
    for (let i = 0; i < parts.length; i++) {
      const pt = parts[i];
      if (animate) {
        pt.p += pt.speed * dt;
        if (pt.p >= 1) pt.p -= 1;
      }
      const e = easeInOut(pt.p);
      const x = pt.from.x + (pt.to.x - pt.from.x) * e;
      const z = pt.from.y + (pt.to.y - pt.from.y) * e;
      pos[i * 3] = x;
      pos[i * 3 + 1] = LAKE.y + 0.12 + Math.sin(pt.p * Math.PI) * 0.15;
      pos[i * 3 + 2] = z;
      const fade = Math.sin(pt.p * Math.PI) * 0.85; // bake alpha into additive color
      col[i * 3] = pt.col[0] * fade;
      col[i * 3 + 1] = pt.col[1] * fade;
      col[i * 3 + 2] = pt.col[2] * fade;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={tex}
        size={0.7}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
