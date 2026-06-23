import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { intro } from '../intro.js';
import { PALETTE } from '../data/zones.js';

const FRAUNCES = '/fonts/fraunces-400.woff';
const INTER = '/fonts/inter-600.woff';

const easeOut = (x) => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);
// fade 0->1 over [start, start+dur], with an upward "from the aether" drift
function reveal(t, start, dur) {
  const f = easeOut((t - start) / dur);
  return { o: f, dy: (1 - f) * 1.6 };
}

// one fading text element (billboarded toward the camera)
function FadeText({ at, base, start, dur, font, color, fontSize, anchorY = 'middle', children, outline }) {
  const grp = useRef();
  const txt = useRef();
  useFrame(() => {
    const { o, dy } = reveal(intro.t, start, dur);
    if (grp.current) grp.current.position.y = base[1] + dy;
    const m = txt.current && txt.current.material;
    if (m) {
      m.transparent = true;
      m.opacity = o;
      m.depthTest = false;
    }
  });
  return (
    <Billboard ref={grp} position={base}>
      <Text
        ref={txt}
        position={[0, 0, 0]}
        font={font}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY={anchorY}
        outlineWidth={outline ? fontSize * 0.04 : 0}
        outlineColor="#06120b"
        outlineOpacity={0.7}
        renderOrder={10}
        material-toneMapped={false}
      >
        {children}
      </Text>
    </Billboard>
  );
}

export default function SkyText() {
  // The cinematic hero title + tagline fade up from the sky. The four tinted
  // section labels are delivered as the animated HTML zone cards (Phase 8),
  // matching the 2D layout and staying legible over the aerial view.
  return (
    <group>
      <FadeText
        base={[0, 10.5, 2]}
        start={9.8}
        dur={1.7}
        font={FRAUNCES}
        color={PALETTE.ink}
        fontSize={2.4}
        outline
      >
        The WPS Data Lake
      </FadeText>

      <FadeText
        base={[0, 8.4, 2]}
        start={10.7}
        dur={1.4}
        font={INTER}
        color="#BAC4AE"
        fontSize={0.62}
        outline
      >
        ONE SOURCE OF TRUTH   ·   FOUR FUNCTIONS   ·   PENDING DISCOVERY
      </FadeText>
    </group>
  );
}
