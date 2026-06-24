import { useEffect, useRef } from 'react';

// start.mp4 ground loop -> swoop.mp4 (plays once, freezes on its final frame) ->
// lake_still.jpg held as the interactive background. Only the active phase's
// video decodes (others are paused) to keep things light. Audio is muted for now.
const SWOOP_CUT = 5.95;

export default function VideoStage({ phase, soundOn, onSwoopEnd }) {
  const startRef = useRef();
  const swoopRef = useRef();
  const cutDone = useRef(false);

  useEffect(() => {
    const start = startRef.current;
    const swoop = swoopRef.current;
    if (start) start.muted = !soundOn;
    if (swoop) swoop.muted = !soundOn;

    if (phase === 'start') {
      swoop?.pause?.();
      start?.play?.().catch(() => {});
    } else if (phase === 'swoop') {
      start?.pause?.(); // stop the ground loop decoding
      if (!swoop) return;
      cutDone.current = false;
      swoop.currentTime = 0;
      swoop.play?.().catch(() => {});
      const onTime = () => {
        if (cutDone.current || swoop.currentTime < SWOOP_CUT) return;
        cutDone.current = true;
        swoop.pause();
        onSwoopEnd?.();
      };
      swoop.addEventListener('timeupdate', onTime);
      return () => swoop.removeEventListener('timeupdate', onTime);
    } else if (phase === 'aerial') {
      // still image is the background — nothing decoding
      start?.pause?.();
      swoop?.pause?.();
    }
  }, [phase, soundOn, onSwoopEnd]);

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
        poster="/img/lake_still.jpg"
        muted
        playsInline
        preload="auto"
        onEnded={onSwoopEnd}
      />
      {/* held still: the swoop's final frame — the interactive background */}
      <img
        className="stage-video"
        style={{ opacity: phase === 'aerial' ? 1 : 0 }}
        src="/img/lake_still.jpg"
        alt=""
      />
    </div>
  );
}
