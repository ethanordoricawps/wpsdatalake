import { useEffect, useState } from 'react';

// Plain-language explainer for first-time viewers / stakeholders.
const SECTIONS = [
  {
    label: 'What it is',
    body: 'A single, governed home for WPS’s data. Today the four functions — Engineering, Field Ops, Partnerships, and Fundraising — live in separate tools and exports. The lake consolidates them into one source of truth, so a question can be answered from real records instead of scattered spreadsheets.',
  },
  {
    label: 'What it requires',
    list: [
      'Consolidation — each function’s sources flow into one place.',
      'Governance — access rules, sensitive data veiled (PII, exact coordinates), a human in the loop.',
      'Health — sources kept in sync and watched for drift or staleness.',
    ],
  },
  {
    label: 'What you can build on it',
    list: [
      'Retrieval — ask the lake and get grounded answers with cited sources.',
      'Agents — narrow, chartered helpers that act on an event and return one grounded result; proven at the edge (e.g. Ranger Dispatch), then scaled.',
    ],
  },
];

export default function About() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button className="about-btn" onClick={() => setOpen(true)}>About</button>
      {open && (
        <div className="charter-backdrop" onClick={() => setOpen(false)}>
          <div className="zone-card about-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="zone-head">
              <div className="zone-head-text">
                <div className="zone-name">The WPS Data Lake</div>
                <div className="zone-sub">One source of truth · four functions</div>
              </div>
              <button className="charter-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            {SECTIONS.map((s) => (
              <div className="zone-block" key={s.label}>
                <div className="zb-label">{s.label}</div>
                {s.list ? (
                  <ul className="about-list">
                    {s.list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <div className="zb-body">{s.body}</div>
                )}
              </div>
            ))}
            <div className="charter-foot">Illustrative — pending discovery</div>
          </div>
        </div>
      )}
    </>
  );
}
