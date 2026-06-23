import { useMemo } from 'react';
import * as THREE from 'three';
import { LAKE } from '../data/lake.js';
import { PALETTE } from '../data/zones.js';

function linVec3(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

// Ground half-extents (covers the aerial framing). Lake is well inside.
const HALF = new THREE.Vector2(42, 30);

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Jungle floor + muddy shoreline ring, mirroring the 2D buildScene():
//   - vertical jungle gradient (far -> near)
//   - muddy shore ring traced at the ellipse edge (radial mud-in -> mud-out)
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uHalf;     // ground half-size
  uniform vec2 uLake;     // lake rx, rz
  uniform vec3 uJungleFar;
  uniform vec3 uJungleNear;
  uniform vec3 uMudIn;
  uniform vec3 uMudOut;

  float wobble(float a) {
    return 1.0
      + 0.06  * sin(3.0 * a + 0.6)
      + 0.035 * sin(2.0 * a - 0.4)
      + 0.02  * sin(5.0 * a + 1.2)
      + 0.015 * sin(7.0 * a - 0.7);
  }

  void main() {
    // world XZ position on the ground plane
    vec2 w = (vUv - 0.5) * 2.0 * uHalf;

    // jungle vertical gradient by depth (z: far -Z -> near +Z)
    float gz = clamp((w.y / uHalf.y) * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uJungleFar, uJungleNear, gz);

    // ellipse-normalized radius around the lake
    vec2 e = w / uLake;
    float a = atan(e.y, e.x);
    float wob = wobble(a);
    float r = length(e);

    // muddy shoreline ring: from the waterline (r = wob) out to r = 1.18*wob
    float ringOuter = 1.18 * wob;
    if (r > wob && r < ringOuter) {
      float k = (r - wob) / (ringOuter - wob);   // 0 at water, 1 at outer
      vec3 mud = mix(uMudIn, uMudOut, k);
      float blend = smoothstep(1.0, 0.55, k);     // fade mud into jungle near outer edge
      col = mix(col, mud, blend);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function JungleFloor() {
  const uniforms = useMemo(
    () => ({
      uHalf: { value: HALF.clone() },
      uLake: { value: new THREE.Vector2(LAKE.rx, LAKE.rz) },
      uJungleFar: { value: linVec3(PALETTE.jungleFar) },
      uJungleNear: { value: linVec3(PALETTE.jungleNear) },
      uMudIn: { value: linVec3(PALETTE.shoreIn) },
      uMudOut: { value: linVec3(PALETTE.shoreOut) },
    }),
    [],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE.y - 0.06, 0]} receiveShadow>
      <planeGeometry args={[HALF.x * 2, HALF.y * 2, 1, 1]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
    </mesh>
  );
}
