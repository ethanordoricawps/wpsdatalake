import { Suspense } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { PALETTE } from '../data/zones.js';
import Lighting from './Lighting.jsx';
import JungleFloor from './JungleFloor.jsx';
import WaterSurface from './WaterSurface.jsx';
import CanopyRing from './CanopyRing.jsx';
import Clouds from './Clouds.jsx';
import Inflow from './Inflow.jsx';
import CameraRig from './CameraRig.jsx';
import SkyText from './SkyText.jsx';
import RippleManager from './RippleManager.jsx';
import Post from './Post.jsx';

// Assembles everything inside the <Canvas>.
export default function Scene({ quality = 'high', animate = true, done = false, onIntroDone, waterHandlers, reduced = false, autoStart = false }) {
  return (
    <>
      {/* Photographic rainforest surround + image-based lighting. The lake and
          floor shaders stay tone-mapping-exempt so the lake keeps its vivid look. */}
      <Suspense fallback={<color attach="background" args={[PALETTE.fog]} />}>
        <Environment files={`${import.meta.env.BASE_URL}hdri/mossy_forest_2k.hdr`} background backgroundBlurriness={0.015} />
      </Suspense>
      <fog attach="fog" args={['#1b2a18', 34, 96]} />
      <Lighting />
      <JungleFloor />
      <WaterSurface animate={animate} {...waterHandlers} />
      <Inflow animate={animate} quality={quality} />
      <RippleManager animate={animate} />
      <Suspense fallback={null}>
        <CanopyRing animate={animate} quality={quality} />
      </Suspense>
      {quality !== 'low' && <Clouds animate={animate} />}
      <CameraRig autoStart={autoStart} onDone={onIntroDone} />
      <SkyText reduced={reduced} />
      <Post quality={quality} />

      {/* Clamped orbit takes over once the intro settles (mounted fresh so it
          initializes from the current aerial camera — no snap-back). */}
      {done && (
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          minDistance={18}
          maxDistance={42}
          minPolarAngle={0.18}
          maxPolarAngle={Math.PI * 0.46}
          minAzimuthAngle={-0.6}
          maxAzimuthAngle={0.6}
        />
      )}
    </>
  );
}
