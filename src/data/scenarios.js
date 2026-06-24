// Concrete, illustrative walkthroughs that drive the live scene: a trigger
// ripples a basin, the responsible agent lights up and draws from its sources,
// and its "catch" surfaces as a grounded brief — with the governance note that
// keeps it trustworthy. All illustrative — pending discovery.
//
// step fields:
//   caption  — the narration line for this beat
//   ripple   — basin key to pulse (the data event)
//   spotlight— agent id to light up (shows it drawing from its sources)
//   brief    — the agent's output card { kicker, title, lines[[k,v]], sources[], guard }
//   dur      — ms to hold before the next beat

export const SCENARIOS = [
  {
    id: 'ranger',
    title: 'Poacher detection',
    agent: 'Ranger Dispatch',
    zone: 'field',
    steps: [
      { caption: 'A perimeter camera fires a high-confidence detection at the north fence.', ripple: 'field', dur: 3800 },
      { caption: 'It lands in the Field Ops inflow — the lake registers it live.', ripple: 'field', dur: 3000 },
      { caption: 'Ranger Dispatch wakes, drawing from Field Ops and checking Partnerships for jurisdiction.', spotlight: 'ranger', dur: 4500 },
      { caption: 'It triages the detection into one prioritized, actionable alert.', spotlight: 'ranger', dur: 3500 },
      {
        caption: 'Out comes a one-screen dispatch brief — grounded, with cited sources.',
        spotlight: 'ranger',
        brief: {
          kicker: 'Dispatch brief',
          title: 'High-confidence detection · north fence',
          lines: [
            ['What', 'Human + vehicle · 0.93 confidence'],
            ['Where', 'Sector 4 perimeter (exact coords veiled)'],
            ['Confidence', 'Above the 0.85 alert floor'],
            ['Notify', 'Lead ranger on duty'],
            ['Why now', 'Repeat detection within 6 minutes'],
          ],
          sources: ['Sector 4 camera', 'detection log'],
          guard: 'Never auto-notifies — a human lead approves. Exact coordinates stay veiled.',
        },
        dur: 9000,
      },
    ],
  },
  {
    id: 'grant',
    title: 'New grant posted',
    agent: 'Grant Scout',
    zone: 'fund',
    steps: [
      { caption: 'A climate-resilience grant is posted on a funder portal.', ripple: 'fund', dur: 3600 },
      { caption: 'It enters Fundraising & Development — Grant Scout is watching.', spotlight: 'grant', dur: 3600 },
      { caption: 'It matches the grant against active Field programs and Partnership commitments.', spotlight: 'grant', dur: 4500 },
      {
        caption: 'It drafts a tailored proposal brief, grounded in real program data.',
        spotlight: 'grant',
        brief: {
          kicker: 'Proposal brief',
          title: 'Climate-resilience grant · strong fit',
          lines: [
            ['Fit', '4 of 5 priorities matched'],
            ['Programs', 'Two active Field deployments qualify'],
            ['Partner', 'Co-funded program already in place'],
            ['Deadline', '21 days'],
            ['Draft', 'Concept note ready for review'],
          ],
          sources: ['grants ledger', 'program records'],
          guard: 'Donor PII veiled. A human approves anything sent.',
        },
        dur: 9000,
      },
    ],
  },
  {
    id: 'repo',
    title: 'Deployment drift',
    agent: 'Repo Sentinel',
    zone: 'eng',
    steps: [
      { caption: 'A change ships to production.', ripple: 'eng', dur: 3400 },
      { caption: 'It lands in Engineering — Repo Sentinel inspects it.', spotlight: 'repo', dur: 3600 },
      { caption: 'It compares what shipped against the docs and Field Ops deployment records.', spotlight: 'repo', dur: 4500 },
      {
        caption: 'It flags the drift before it reaches the field, with cited sources.',
        spotlight: 'repo',
        brief: {
          kicker: 'Drift report',
          title: 'Deploy v2.4.1 · 2 drifts found',
          lines: [
            ['Shipped', 'New camera-sync endpoint'],
            ['Docs', 'Still describe the old endpoint'],
            ['Field impact', '3 deployments reference the old path'],
            ['Severity', 'Medium — no outage yet'],
            ['Suggest', 'Update runbook + notify Field Ops'],
          ],
          sources: ['GitHub', 'deploy log'],
          guard: 'No write access. Secrets & keys veiled.',
        },
        dur: 9000,
      },
    ],
  },
  {
    id: 'partner',
    title: 'MOU amended',
    agent: 'Partner Sync',
    zone: 'part',
    steps: [
      { caption: 'An MOU with a regional partner is amended.', ripple: 'part', dur: 3400 },
      { caption: 'Partnerships registers the change — Partner Sync reviews it.', spotlight: 'partner', dur: 3600 },
      { caption: 'It surfaces new obligations and the dates that now matter.', spotlight: 'partner', dur: 4200 },
      {
        caption: 'It returns an obligation digest, grounded and cited.',
        spotlight: 'partner',
        brief: {
          kicker: 'Obligation digest',
          title: 'Regional MOU · v3 amendments',
          lines: [
            ['New', 'Quarterly data-sharing report added'],
            ['Renewal', 'Auto-renews in 58 days'],
            ['Owner', 'Partnerships lead'],
            ['Risk', 'Reporting cadence not yet scheduled'],
          ],
          sources: ['partner records', 'MOU v3'],
          guard: 'Partner-confidential terms honored. Read-only.',
        },
        dur: 9000,
      },
    ],
  },
];
