import { useState } from 'react';

// "Tap to enter" gate — the autoplay workaround. Click starts audio + the
// cinematic intro, then the gate fades out.
export default function EnterGate({ onEnter }) {
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    onEnter();
  };

  return (
    <div
      className={`gate ${leaving ? 'leaving' : ''}`}
      onClick={enter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') enter(); }}
    >
      <h1>The WPS Data Lake</h1>
      <div className="sub">one source of truth · four functions · pending discovery</div>
      <div className="enter"><span className="dot" /> Enter the lake</div>
    </div>
  );
}
