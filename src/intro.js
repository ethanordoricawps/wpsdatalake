// Shared intro-timeline clock. CameraRig writes it each frame; SkyText, audio
// and the bloom ramp read it. Module singleton — fine for a single <Canvas>.

export const intro = {
  started: false, // EnterGate flips this true (Phase 8)
  startTime: 0, // clock.elapsedTime when started
  t: 0, // seconds since start
  done: false, // intro finished -> OrbitControls may take over
  reduced: false, // prefers-reduced-motion: snap to end-state
};

// Timeline keyframes (seconds). See build brief §4.
export const T = {
  forestEnd: 4, // 0–4  forest interior
  swoopEnd: 8, // 4–8  swoop up through canopy
  settleEnd: 10, // 8–10 flatten & settle to aerial
  textEnd: 13, // 10–13 text fades up; then OrbitControls take over
};

if (import.meta.env && import.meta.env.DEV) {
  window.__intro = intro;
}

export function resetIntro(reduced) {
  intro.started = false;
  intro.startTime = 0;
  intro.t = reduced ? T.textEnd : 0;
  intro.done = !!reduced;
  intro.reduced = !!reduced;
}
