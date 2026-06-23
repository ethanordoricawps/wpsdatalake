import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { intro, T } from '../intro.js';
import { PALETTE } from '../data/zones.js';

const FRAUNCES = '/fonts/fraunces-400.woff';
const INTER = '/fonts/inter-600.woff';

const easeOut = (x) => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);
const easeIn = (x) => Math.pow(THREE.MathUtils.clamp(x, 0, 1), 2);
// fade in over [start, start+dur] with an upward drift, then fade out at outStart
function reveal(t, start, dur, outStart, outDur) {
  const fin = easeOut((t - start) / dur);
  const fout = outStart != null ? 1 - easeIn((t - outStart) / outDur) : 1;
  return { o: Math.max(0, fin * fout), dy: (1 - fin) * 1.6 };
}

// one fading text element (billboarded toward the camera)
function FadeText({ base, start, dur, outStart, outDur, font, color, fontSize, anchorY = 'middle', children, outline }) {
  const grp = useRef();
  const txt = useRef();
  const lastO = useRef(-1);
  useFrame(() => {
    const { o, dy } = reveal(intro.t, start, dur, outStart, outDur);
    if (grp.current) grp.current.position.y = base[1] + dy;
    const tx = txt.current;
    if (!tx) return;
    // float above the canopy regardless of depth (cheap material flags, no sync)
    if (tx.material) {
      tx.material.depthTest = false;
      tx.material.transparent = true;
    }
    // Troika fill alpha is driven by fillOpacity (needs sync) — not material.opacity
    if (Math.abs(o - lastO.current) > 0.004) {
      lastO.current = o;
      tx.fillOpacity = o;
      tx.outlineOpacity = o * 0.7;
      tx.visible = o > 0.004;
      tx.sync();
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
        fillOpacity={0}
        outlineOpacity={0}
        visible={false}
        renderOrder={10}
        material-toneMapped={false}
      >
        {children}
      </Text>
    </Billboard>
  );
}

export default function SkyText({ reduced = false }) {
  // The cinematic hero title + tagline fade up from the sky during the reveal,
  // then fade OUT as the HTML header takes over (handoff to the persistent UI).
  // Skipped entirely under reduced motion (the HTML header shows immediately).
  if (reduced) return null;
  return (
    <group>
      <FadeText
        base={[0, 10.5, 2]}
        start={T.settleEnd - 0.3}
        dur={1.5}
        outStart={T.textEnd}
        outDur={1.5}
        font={FRAUNCES}
        color={PALETTE.ink}
        fontSize={2.4}
        outline
      >
        The WPS Data Lake
      </FadeText>

      <FadeText
        base={[0, 8.4, 2]}
        start={T.settleEnd + 0.4}
        dur={1.3}
        outStart={T.textEnd}
        outDur={1.3}
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
