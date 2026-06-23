import { OrbitControls } from '@react-three/drei';
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
      <color attach="background" args={[PALETTE.fog]} />
      <fog attach="fog" args={[PALETTE.fog, 38, 95]} />
      <Lighting />
      <JungleFloor />
      <WaterSurface animate={animate} {...waterHandlers} />
      <Inflow animate={animate} quality={quality} />
      <RippleManager animate={animate} />
      <CanopyRing animate={animate} quality={quality} />
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
