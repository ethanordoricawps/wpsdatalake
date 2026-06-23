import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE } from '../data/lake.js';
import { PALETTE } from '../data/zones.js';

// Linear-space vec3 uniform from a hex string (matches sRGB output encoding).
function linVec3(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Phase 1: gradient + elliptical shoreline clip + edge depth darkening.
// (Animated normals, shimmer and sunlight pools arrive in Phase 3.)
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform vec3 uInk;
  uniform float uTime;

  // 2D traceOn() shoreline wobble.
  float wobble(float a) {
    return 1.0
      + 0.06  * sin(3.0 * a + 0.6)
      + 0.035 * sin(2.0 * a - 0.4)
      + 0.02  * sin(5.0 * a + 1.2)
      + 0.015 * sin(7.0 * a - 0.7);
  }

  void main() {
    // plane space: (x/rx, z/rz) in [-1, 1]
    vec2 p = (vUv - 0.5) * 2.0;
    float a = atan(p.y, p.x);
    float wob = wobble(a);
    float r = length(p);
    if (r > wob) discard;

    // vertical water gradient (top -> mid -> deep), mirroring the 2D fill
    vec3 col = vUv.y < 0.5
      ? mix(uTop, uMid, vUv.y / 0.5)
      : mix(uMid, uDeep, (vUv.y - 0.5) / 0.5);

    // darken toward the shoreline (2D inner vignette)
    float edge = smoothstep(0.35, 1.0, r / wob);
    col = mix(col, uInk, edge * 0.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function WaterSurface() {
  const matRef = useRef();
  const uniforms = useMemo(
    () => ({
      uTop: { value: linVec3(PALETTE.waterTop) },
      uMid: { value: linVec3(PALETTE.waterMid) },
      uDeep: { value: linVec3(PALETTE.waterDeep) },
      uInk: { value: new THREE.Vector3(4 / 255, 16 / 255, 12 / 255) },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE.y, 0]} receiveShadow>
      {/* Plane sized to the ellipse waterline (2·rx × 2·rz). */}
      <planeGeometry args={[LAKE.rx * 2, LAKE.rz * 2, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
      />
    </mesh>
  );
}
