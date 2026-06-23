// Warm directional "sun" at a god-ray angle + low ambient.
// (God-ray / light-shaft post pass arrives with the intro + post phase.)
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.32} color="#3a5240" />
      <hemisphereLight args={['#9fb98a', '#0a1c10', 0.35]} />
      <directionalLight
        position={[-14, 22, -10]}
        intensity={1.25}
        color="#fff3cf"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
    </>
  );
}
