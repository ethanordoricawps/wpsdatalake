import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

// Bloom makes the basin glows bleed; vignette frames the aerial view.
// (God-ray / light-shaft pass joins here with the intro phase.)
export default function Post({ quality = 'high' }) {
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.7}
        mipmapBlur
        radius={0.6}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.7} />
    </EffectComposer>
  );
}
