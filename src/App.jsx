import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './scene/Scene.jsx';
import { resetIntro } from './intro.js';

// Camera starts low in the forest interior; CameraRig drives the swoop to aerial.
const CAMERA = { position: [4, 2.4, 25], fov: 45, near: 0.1, far: 200 };

export default function App() {
  const [reduced] = useState(
    () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    resetIntro(reduced);
  }, [reduced]);

  return (
    <Canvas
      shadows
      flat
      camera={CAMERA}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <Scene animate={!reduced} />
    </Canvas>
  );
}
