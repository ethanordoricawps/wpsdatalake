// Agents as creatures of the lake. Each has a six-field CHARTER (see
// docs/LIVING_DATA_LAKE_CONCEPT.md). One edge-case agent is proven first
// (Ranger Dispatch); the rest show the pattern that scales (roadmap Step 5).
// All illustrative — pending discovery.
//
// `sources` = which function basins the agent draws from, weighted by how much
// of its data comes from each. The marker floats at the weighted centroid of
// those basins (a Venn position): an agent reading mostly one section sits deep
// in it; a cross-function agent lives between its sources, nearest the heaviest.

export const AGENTS = [
  {
    id: 'ranger',
    name: 'Ranger Dispatch',
    creature: 'Heron',
    zone: 'field',
    sources: { field: 0.6, part: 0.4 },
    edge: true,
    status: 'Edge case · in build',
    territory: 'Field Ops & Deployments (read-only); may consult Partnerships for jurisdiction',
    trigger: 'A new high-confidence camera/sensor detection lands in the Field Ops inflow',
    instinct: 'Triage the detection into a prioritized, actionable ranger alert',
    catch: 'A one-screen dispatch brief — what, where, confidence, who to notify, why now — with cited sources',
    guardrails: 'Never auto-notifies (human lead approves); confidence floor; exact camera coordinates stay veiled',
    baseline: 'Time-to-triage and precision vs. the current manual process',
  },
  {
    id: 'grant',
    name: 'Grant Scout',
    creature: 'Kingfisher',
    zone: 'fund',
    sources: { fund: 0.55, part: 0.25, field: 0.2 },
    status: 'Pattern',
    territory: 'Fundraising & Development (grants ledger, donor records); reads Field & Partnership programs to match grants',
    trigger: 'A new grant is posted, or on a weekly cadence',
    instinct: 'Match open grants to active programs and draft a tailored brief',
    catch: 'A proposal brief grounded in program data, with cited sources',
    guardrails: 'Donor PII veiled; a human approves anything sent',
    baseline: 'Hours saved vs. manual scanning; match quality',
  },
  {
    id: 'partner',
    name: 'Partner Sync',
    creature: 'Otter',
    zone: 'part',
    sources: { part: 0.6, fund: 0.4 },
    status: 'Pattern',
    territory: 'Partnerships (partner records, shared program data); aligns with Fundraising on co-funded programs',
    trigger: 'An MOU or agreement changes',
    instinct: 'Surface obligations and upcoming renewal dates',
    catch: 'An obligation digest with cited sources',
    guardrails: 'Partner-confidential terms honored; read-only',
    baseline: 'Missed-deadline / missed-obligation rate',
  },
  {
    id: 'repo',
    name: 'Repo Sentinel',
    creature: 'Dragonfly',
    zone: 'eng',
    sources: { eng: 0.75, field: 0.25 },
    status: 'Pattern',
    territory: 'Engineering (Azure databases, GitHub repositories); cross-checks Field Ops deployments',
    trigger: 'A new commit or deployment',
    instinct: 'Flag drift between what shipped and what the docs say',
    catch: 'A drift report with cited sources',
    guardrails: 'No write access; secrets/keys veiled',
    baseline: 'Issues caught before production',
  },
];

export const CHARTER_FIELDS = [
  ['territory', 'Territory', 'which basins/sources it may draw from (governed)'],
  ['trigger', 'Trigger', 'what wakes it'],
  ['instinct', 'Instinct', 'the one workflow it performs'],
  ['catch', 'Catch', 'what it produces — grounded, with cited sources'],
  ['guardrails', 'Guardrails', 'thresholds, sensitive limits, human-in-the-loop'],
  ['baseline', 'Baseline & eval', 'the measure its catch is judged against'],
];
