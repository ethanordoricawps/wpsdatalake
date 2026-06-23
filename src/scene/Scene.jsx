import { PALETTE } from '../data/zones.js';
import Lighting from './Lighting.jsx';
import JungleFloor from './JungleFloor.jsx';
import WaterSurface from './WaterSurface.jsx';
import Post from './Post.jsx';

// Assembles everything inside the <Canvas>.
// Phase 1: floor + flat lake + fog.  Phase 2: basin glows + channels + bloom.
export default function Scene({ hovered = null, quality = 'high' }) {
  return (
    <>
      <color attach="background" args={[PALETTE.fog]} />
      <fog attach="fog" args={[PALETTE.fog, 38, 95]} />
      <Lighting />
      <JungleFloor />
      <WaterSurface hovered={hovered} />
      <Post quality={quality} />
    </>
  );
}
