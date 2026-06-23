import { PALETTE } from '../data/zones.js';
import Lighting from './Lighting.jsx';
import JungleFloor from './JungleFloor.jsx';
import WaterSurface from './WaterSurface.jsx';

// Assembles everything inside the <Canvas>. Phase 1: floor + flat lake + fog.
export default function Scene() {
  return (
    <>
      <color attach="background" args={[PALETTE.fog]} />
      <fog attach="fog" args={[PALETTE.fog, 38, 95]} />
      <Lighting />
      <JungleFloor />
      <WaterSurface />
    </>
  );
}
