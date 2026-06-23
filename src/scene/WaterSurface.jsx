import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE, CELLS } from '../data/lake.js';
import { PALETTE, rgbCss } from '../data/zones.js';
import { lake } from '../lake-state.js';

// Linear-space vec3 from a hex string (three converts sRGB->linear on parse).
function linVec3(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

// Linear-space vec3 from an [r,g,b] 0-255 triplet.
function linVec3Rgb(rgb) {
  const c = new THREE.Color(rgbCss(rgb));
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

// Water gradient + elliptical shoreline clip + edge darkening (Phase 1),
// PLUS the four basin glows and the meandering channel seams (Phase 2).
// This is the 3D twin of the 2D draw(): additive radial basin gradients
// ('lighter' composite) + two-width meander strokes dividing the basins.
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;

  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform vec3 uInk;
  uniform float uTime;
  uniform float uGlow;        // glowIntensity prop

  // basins
  uniform vec2  uCenter[4];   // world XZ of each cell center
  uniform vec3  uColor[4];    // basin color (linear)
  uniform float uRad[4];      // basin radius
  uniform float uBright[4];   // glow weight
  uniform float uPhase[4];    // pulse phase offset
  uniform float uHover[4];    // 0/1 hover lift

  // channels
  uniform float uXs, uZL, uZR, uLeft, uRight, uTop2, uBot, uAmp;
  uniform vec3  uChannel;

  // surface (Phase 3)
  uniform vec3  uSunDir;     // toward the sun (normalized)
  uniform vec3  uSun;        // warm sun/pool color (linear)
  uniform vec3  uShimmer;    // surface shimmer color (linear)
  uniform float uPoolR;      // sunlight-pool radius (world)

  float wobble(float a) {
    return 1.0
      + 0.06  * sin(3.0 * a + 0.6)
      + 0.035 * sin(2.0 * a - 0.4)
      + 0.02  * sin(5.0 * a + 1.2)
      + 0.015 * sin(7.0 * a - 0.7);
  }

  // meander offset along a channel (f = world coord along the seam)
  float meander(float f, float phase) {
    return sin(f * 0.30 + uTime * 0.5  + phase)       * uAmp
         + sin(f * 0.66 - uTime * 0.32 + phase * 1.4) * uAmp * 0.45;
  }

  // soft two-width band around a signed distance to the seam
  float band(float d) {
    float wide   = (1.0 - smoothstep(0.0, uAmp * 0.95, abs(d))) * 0.055;
    float narrow = (1.0 - smoothstep(0.0, uAmp * 0.34, abs(d))) * 0.11;
    return wide + narrow;
  }

  // one directional ripple wave's height contribution + analytic gradient.
  // accumulates dHeight/dx and dHeight/dz into grad.
  float wave(vec2 wp, vec2 dir, float freq, float speed, float amp, inout vec2 grad) {
    float ph = dot(wp, dir) * freq + uTime * speed;
    grad += amp * cos(ph) * dir * freq;
    return amp * sin(ph);
  }

  // perturbed surface normal from a few crossing ripples (drives the glints)
  vec3 waterNormal(vec2 wp) {
    vec2 grad = vec2(0.0);
    wave(wp, normalize(vec2(0.85, 0.55)), 1.7, 0.9,  0.018, grad);
    wave(wp, normalize(vec2(-0.5, 0.9)),  2.3, 0.7,  0.012, grad);
    wave(wp, normalize(vec2(0.2, -1.0)),  3.1, 1.3,  0.008, grad);
    return normalize(vec3(-grad.x, 1.0, -grad.y));
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;          // (x/rx, z/rz) in [-1,1]
    float a = atan(p.y, p.x);
    float wob = wobble(a);
    float r = length(p);
    if (r > wob) discard;

    // base vertical water gradient
    vec3 col = vUv.y < 0.5
      ? mix(uTop, uMid, vUv.y / 0.5)
      : mix(uMid, uDeep, (vUv.y - 0.5) / 0.5);

    vec2 wp = vWorld.xz;

    // ---- basin glows (additive) ----
    for (int i = 0; i < 4; i++) {
      float pulse = 0.5 + 0.5 * sin(uTime * 0.4 + uPhase[i]);
      float al = (0.13 + 0.34 * uBright[i] + pulse * 0.05 + uHover[i] * 0.22) * uGlow;
      float rad = uRad[i] * 0.9;
      float d = distance(wp, uCenter[i]);
      float rr = clamp(d / rad, 0.0, 1.0);
      float ga = rr < 0.5
        ? mix(al, al * 0.48, rr / 0.5)
        : mix(al * 0.48, 0.0, (rr - 0.5) / 0.5);
      // additive in a softened (perceptual-ish) amount so dark water reads
      // between the basins instead of piling up to milk where they overlap
      col += uColor[i] * max(ga, 0.0) * 0.6;
    }

    // ---- meandering channel seams ----
    float ch = 0.0;
    // vertical divide at x = xs (spans top..bot)
    ch += band(wp.x - (uXs + meander(wp.y, 0.0)));
    // left-column horizontal at z = zL (x in [left, xs])
    if (wp.x <= uXs) ch += band(wp.y - (uZL + meander(wp.x, 1.3))) * 0.85;
    // right-column horizontal at z = zR (x in [xs, right])
    if (wp.x >  uXs) ch += band(wp.y - (uZR + meander(wp.x, 2.6))) * 0.85;
    col += uChannel * ch;

    // ---- surface shimmer: sun glints off animated ripples ----
    vec3 N = waterNormal(wp);
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 H = normalize(uSunDir + V);
    float spec = pow(max(dot(N, H), 0.0), 90.0);
    col += uSun * spec * 0.6;                       // sharp warm glints
    // broad sky sheen + gentle dappled shimmer
    float sheen = pow(max(dot(N, H), 0.0), 14.0);
    col += uShimmer * sheen * 0.05;

    // ---- pools of sunlight drifting across the water (2D lissajous) ----
    for (int j = 0; j < 5; j++) {
      float fj = float(j);
      vec2 pc = vec2(sin(uTime * 0.07 + fj * 1.3) * (uRight * 0.5),
                     cos(uTime * 0.05 + fj * 2.1) * (uBot * 0.5));
      float pd = distance(wp, pc);
      float pa = (1.0 - smoothstep(0.0, uPoolR, pd)) * 0.06;
      col += uSun * pa;
    }

    // darken toward the shoreline (2D inner vignette)
    float edge = smoothstep(0.35, 1.0, r / wob);
    col = mix(col, uInk, edge * 0.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Per-basin static arrays (geometry is fixed once LAKE is set).
const ORDER = ['eng', 'part', 'field', 'fund']; // matches 2D draw order
function basinArrays() {
  const centers = [];
  const colors = [];
  const rads = [];
  const brights = [];
  const phases = [];
  ORDER.forEach((k, i) => {
    const c = CELLS.cells[k];
    centers.push(new THREE.Vector2(c.cx, c.cz));
    colors.push(linVec3Rgb(c.z.color));
    rads.push(Math.hypot(c.w, c.d) / 2);
    brights.push(c.z.bright);
    phases.push(i * 1.7 + c.cx * 0.15 + c.cz * 0.2); // distinct per-basin pulse
  });
  return { centers, colors, rads, brights, phases };
}

const STATIC_T = 4.0; // frozen clock for the reduced-motion static frame

export default function WaterSurface({ glowIntensity = 1, animate = true, ...handlers }) {
  const matRef = useRef();
  const b = useMemo(basinArrays, []);
  const { bounds } = CELLS;

  const uniforms = useMemo(
    () => ({
      uTop: { value: linVec3(PALETTE.waterTop) },
      uMid: { value: linVec3(PALETTE.waterMid) },
      uDeep: { value: linVec3(PALETTE.waterDeep) },
      uInk: { value: new THREE.Vector3(4 / 255, 16 / 255, 12 / 255) },
      uTime: { value: 0 },
      uGlow: { value: glowIntensity },
      uCenter: { value: b.centers },
      uColor: { value: b.colors },
      uRad: { value: b.rads },
      uBright: { value: b.brights },
      uPhase: { value: b.phases },
      uHover: { value: [0, 0, 0, 0] },
      uXs: { value: bounds.xs },
      uZL: { value: bounds.zL },
      uZR: { value: bounds.zR },
      uLeft: { value: bounds.left },
      uRight: { value: bounds.right },
      uTop2: { value: bounds.top },
      uBot: { value: bounds.bot },
      uAmp: { value: LAKE.rz * 0.16 },
      uChannel: { value: linVec3Rgb(PALETTE.shimmer) },
      uSunDir: { value: new THREE.Vector3(-14, 22, -10).normalize() },
      uSun: { value: linVec3Rgb(PALETTE.sunPool) },
      uShimmer: { value: linVec3Rgb(PALETTE.shimmer) },
      uPoolR: { value: Math.max(LAKE.rx, LAKE.rz) * 0.42 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = animate ? state.clock.elapsedTime : STATIC_T;
    m.uniforms.uGlow.value = glowIntensity;
    // hover lift (ORDER = eng, part, field, fund), eased toward target
    const hv = m.uniforms.uHover.value;
    const h = lake.hovered;
    const tgt = [h === 'eng', h === 'part', h === 'field', h === 'fund'];
    for (let i = 0; i < 4; i++) hv[i] += ((tgt[i] ? 1 : 0) - hv[i]) * 0.15;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE.y, 0]} receiveShadow {...handlers}>
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
