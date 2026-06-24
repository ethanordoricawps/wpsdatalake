import { useEffect, useRef } from 'react';

// Two videos + a held still:
//   start  -> start.mp4 ground-level loop (Enter button lives here)
//   swoop  -> swoop.mp4 plays once (with audio), then we FREEZE on its final
//             frame (lake_still.jpg) as the interactive background — no aerial
//             loop (the loop's motion didn't hold up; a clean still does).
// Pausing the swoop at SWOOP_CUT and crossfading to the matching still keeps
// the handoff seamless (same frame).
const SWOOP_CUT = 5.95;

export default function VideoStage({ phase, soundOn, onSwoopEnd, reduced }) {
  const startRef = useRef();
  const swoopRef = useRef();
  const cutDone = useRef(false);

  useEffect(() => {
    const start = startRef.current;
    const swoop = swoopRef.current;

    if (phase === 'start') {
      start?.play?.().catch(() => {});
    } else if (phase === 'swoop') {
      if (!swoop) return;
      cutDone.current = false;
      swoop.muted = true; // audio comes from the designed WebAudio bed
      swoop.currentTime = 0;
      swoop.play?.().catch(() => {});
      // freeze on the final frame and hand off to the held still
      const onTime = () => {
        if (cutDone.current || swoop.currentTime < SWOOP_CUT) return;
        cutDone.current = true;
        swoop.pause();
        onSwoopEnd?.();
      };
      swoop.addEventListener('timeupdate', onTime);
      return () => swoop.removeEventListener('timeupdate', onTime);
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
