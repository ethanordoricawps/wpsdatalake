import { useEffect, useRef } from 'react';

// Three stacked videos crossfaded by phase:
//   start  -> 1.mp4 ground-level loop (Enter button lives here)
//   swoop  -> 4.mp4 plays once (with audio), ends on the aerial lake
//   aerial -> 2.mp4 aerial lake loop (interactive layer sits on top)
// Posters back each video so a frame shows even if decoding isn't available.
export default function VideoStage({ phase, soundOn, onSwoopEnd, reduced }) {
  const startRef = useRef();
  const swoopRef = useRef();
  const aerialRef = useRef();

  // drive playback off the phase
  useEffect(() => {
    const start = startRef.current;
    const swoop = swoopRef.current;
    const aerial = aerialRef.current;

    if (phase === 'start') {
      start?.play?.().catch(() => {});
    } else if (phase === 'swoop') {
      if (swoop) {
        swoop.muted = !soundOn;
        swoop.currentTime = 0;
        swoop.play?.().catch(() => {});
      }
    } else if (phase === 'aerial') {
      // reduced motion: hold the poster (no looping video)
      if (reduced) aerial?.pause?.();
      else aerial?.play?.().catch(() => {});
    }
  }, [phase, soundOn, reduced]);

  const vis = (p) => ({ opacity: phase === p ? 1 : 0 });

  return (
    <div className="video-stage">
      <video
        ref={startRef}
        className="stage-video"
        style={vis('start')}
        src="/video/start.mp4"
        poster="/img/start_poster.jpg"
        loop
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={swoopRef}
        className="stage-video"
        style={vis('swoop')}
        src="/video/swoop.mp4"
        poster="/img/aerial_poster.jpg"
        playsInline
        preload="auto"
        onEnded={onSwoopEnd}
      />
      <video
        ref={aerialRef}
        className="stage-video"
        style={vis('aerial')}
        src="/video/aerial.mp4"
        poster="/img/aerial_poster.jpg"
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
