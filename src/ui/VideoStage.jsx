import { useEffect, useRef } from 'react';

// Two videos + a held still, using the clips' own (Veo-generated) audio:
//   start  -> start.mp4 ground loop. Muted on the landing (autoplay rule); on
//             Enter it becomes audible for a short beat (the jungle "comes
//             alive") before the swoop.
//   swoop  -> swoop.mp4 plays once with its real audio (jungle + rush), then we
//             FREEZE on its final frame (lake_still.jpg).
//   aerial -> the still is the visible background; aerial.mp4 plays hidden,
//             looped, at low volume as the quiet lake idle bed.
const SWOOP_CUT = 5.95;
const AERIAL_VOL = 0.6;

export default function VideoStage({ phase, entered, soundOn, onSwoopEnd }) {
  const startRef = useRef();
  const swoopRef = useRef();
  const aerialRef = useRef();
  const cutDone = useRef(false);

  useEffect(() => {
    const start = startRef.current;
    const swoop = swoopRef.current;
    const aerial = aerialRef.current;

    // audio routing per phase (videos carry their own tracks)
    if (start) start.muted = !(soundOn && entered && phase === 'start');
    if (swoop) swoop.muted = !(soundOn && phase === 'swoop');
    if (aerial) { aerial.muted = !(soundOn && phase === 'aerial'); aerial.volume = AERIAL_VOL; }

    if (phase === 'start') {
      start?.play?.().catch(() => {});
    } else if (phase === 'swoop') {
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
      if (aerial) { aerial.currentTime = 0; aerial.loop = true; aerial.play?.().catch(() => {}); }
    }
  }, [phase, entered, soundOn, onSwoopEnd]);

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
      {/* aerial clip plays hidden, looped — supplies the quiet lake idle audio */}
      <video
        ref={aerialRef}
        className="stage-audio"
        src="/video/aerial.mp4"
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
    </div>
  );
}
