import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE, shoreWobble } from '../data/lake.js';
import { FOLIAGE } from '../data/zones.js';

// deterministic RNG so the canopy (and the reduced-motion static frame) is stable
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUND = { x: 40, z: 28 }; // scatter extent (inside JungleFloor's HALF)

// Build instance transforms + colors. Fills the jungle outside the lake,
// denser at the shoreline (the 2D "overhang" ring), mirroring buildScene().
function buildInstances(COUNT) {
  const rng = mulberry32(0xc0ffee);
  const dummy = new THREE.Object3D();
  const matrices = [];
  const colors = [];

  const foliageHi = FOLIAGE.map((pair) => new THREE.Color(pair[1])); // highlight tint
  const pushBlob = (x, z, scale, tint) => {
    dummy.position.set(x, scale * 0.45 - 0.1, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    dummy.scale.set(scale, scale * (0.78 + rng() * 0.3), scale);
    dummy.updateMatrix();
    matrices.push(dummy.matrix.clone());
    colors.push(tint);
  };

  let placed = 0;
  // 1) dense shoreline ring (overhang) — right at the waterline, scale 1.0–1.13
  const ringN = Math.floor(COUNT * 0.32);
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2 + (rng() - 0.5) * 0.18;
    const norm = 1.0 + rng() * 0.13;
    const rr = shoreWobble(a) * norm;
    const x = Math.cos(a) * LAKE.rx * rr;
    const z = Math.sin(a) * LAKE.rz * rr;
    pushBlob(x, z, 1.0 + rng() * 1.6, foliageHi[(rng() * FOLIAGE.length) | 0]);
    placed++;
  }
  // 2) scattered canopy filling the jungle outward (skip inside the lake)
  while (placed < COUNT) {
    const x = (rng() * 2 - 1) * GROUND.x;
    const z = (rng() * 2 - 1) * GROUND.z;
    const a = Math.atan2(z / LAKE.rz, x / LAKE.rx);
    const norm = Math.hypot(x / LAKE.rx, z / LAKE.rz) / shoreWobble(a);
    if (norm < 1.16) continue; // keep the water clear
    // bigger, denser further out
    const scale = 1.2 + rng() * 2.4 + Math.min(norm, 3) * 0.3;
    pushBlob(x, z, scale, foliageHi[(rng() * FOLIAGE.length) | 0]);
    placed++;
  }
  return { matrices, colors };
}

export default function CanopyRing({ animate = true, quality = 'high' }) {
  const ref = useRef();
  const matRef = useRef();
  const windRef = useRef({ value: 0 });
  const count = quality === 'low' ? 380 : 820;
  const { matrices, colors } = useMemo(() => buildInstances(count), [count]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, colors[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  useFrame((state) => {
    if (animate) windRef.current.value = state.clock.elapsedTime;
  });

  // Inject per-instance wind sway into a standard (lit) material.
  const onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windRef.current;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWind;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         // phase from this instance's world placement (3D twin of sin(t*0.6 + a*3))
         float wph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;
         float topFactor = clamp(position.y * 0.5 + 0.5, 0.15, 1.0);
         float sway = sin(uWind * 0.6 + wph) * 0.14 * topFactor;
         transformed.x += sway;
         transformed.z += cos(uWind * 0.5 + wph) * 0.08 * topFactor;`,
      );
  };

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, matrices.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        flatShading
        roughness={0.95}
        metalness={0}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
