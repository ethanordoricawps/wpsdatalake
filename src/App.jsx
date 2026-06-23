import { Canvas } from '@react-three/fiber';
import Scene from './scene/Scene.jsx';

// Phase 1: fixed aerial camera framing the lake from above.
const CAMERA = { position: [0, 25, 19], fov: 45, near: 0.1, far: 200 };

export default function App() {
  return (
    <Canvas
      shadows
      flat
      camera={CAMERA}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <Scene />
    </Canvas>
  );
}
