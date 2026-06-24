import { useState } from 'react';

// "Tap to enter" gate — the autoplay workaround. Only the button starts audio +
// the cinematic intro (clicking elsewhere does nothing), then the gate fades out.
export default function EnterGate({ onEnter }) {
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    onEnter();
  };

  return (
    <div className={`gate ${leaving ? 'leaving' : ''}`}>
      <h1>The WPS Data Lake</h1>
      <div className="sub">one source of truth · four functions · pending discovery</div>
      <button className="enter" onClick={enter}><span className="dot" /> Enter the lake</button>
    </div>
  );
}
