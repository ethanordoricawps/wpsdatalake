import { useEffect, useState } from 'react';
import { ZONES, rgbCss } from '../data/zones.js';

// object-fit:cover mapping of the 16:9 frame into the viewport
function cover(vw, vh) {
  const arV = 16 / 9;
  let w, h;
  if (vw / vh > arV) { w = vw; h = vw / arV; } else { h = vh; w = vh * arV; }
  return { ox: (vw - w) / 2, oy: (vh - h) / 2, w, h };
}

// Labels anchored to each section's centroid on the lake (name + live count),
// tinted to the zone color. Inflow gets an "incoming data" tag.
export default function SectionLabels({ centroids, counts, visible }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  if (!centroids) return null;
  const c = cover(vp.w, vp.h);
  const pos = (n) => centroids[n] && { left: c.ox + centroids[n][0] * c.w, top: c.oy + centroids[n][1] * c.h };

  return (
    <div className={`lake-labels ${visible ? 'show' : ''}`}>
      {['eng', 'field', 'part', 'fund'].map((k) => {
        const p = pos(k); if (!p) return null;
        const z = ZONES[k];
        return (
          <div key={k} className="lake-label" style={{ left: p.left, top: p.top }}>
            <div className="ll-name" style={{ color: rgbCss(z.color) }}>{z.name}</div>
            <div className="ll-count">
              <span className="ll-num" style={{ color: rgbCss(z.color) }}>{counts[k].toLocaleString('en-US')}</span>
              <span className="ll-q">queries</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
