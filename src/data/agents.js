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
    trust: ['Human approval', 'Coordinates veiled', 'Cited sources'],
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
    trust: ['Human approval', 'Donor PII veiled', 'Cited sources'],
    name: 'Grant Scout',
    creature: 'Kingfisher',
    zone: 'fund',
    sources: { fund: 0.55, part: 0.25, field: 0.2 },
    nudge: [-0.06, -0.01], // shift left so it doesn't sit on the Fundraising label
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
    trust: ['Read-only', 'Partner-confidential', 'Cited sources'],
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
    trust: ['Read-only', 'Secrets veiled', 'Cited sources'],
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
  {
    id: 'pipeline',
    trust: ['Read-only', 'Secrets veiled', 'Cited sources'],
    name: 'Pipeline Watch',
    creature: 'Damselfly',
    zone: 'eng',
    sources: { eng: 1 },          // deep in Engineering
    nudge: [-0.04, -0.05],        // sit toward the eng feed, off the label
    status: 'Pattern',
    territory: 'Engineering (CI/CD pipelines, build & deploy logs)',
    trigger: 'A pipeline run fails or regresses on time/size',
    instinct: 'Summarize the failure and its likely cause',
    catch: 'A build-failure digest with cited logs',
    guardrails: 'Read-only; secrets & keys veiled',
    baseline: 'Mean time to diagnose vs. manual log triage',
  },
  {
    id: 'sensor',
    trust: ['Read-only', 'Coordinates veiled', 'Cited sources'],
    name: 'Sensor Sentinel',
    creature: 'Osprey',
    zone: 'field',
    sources: { field: 1 },        // deep in Field Ops
    nudge: [0.04, -0.05],
    status: 'Pattern',
    territory: 'Field Ops (camera & sensor telemetry)',
    trigger: 'A device goes offline or its readings drift',
    instinct: 'Flag the device and its last-known status',
    catch: 'A device-health alert with cited telemetry',
    guardrails: 'Exact coordinates veiled; read-only',
    baseline: 'Coverage gaps caught before they widen',
  },
  {
    id: 'impact',
    trust: ['Read-only', 'Partner-confidential', 'Cited sources'],
    name: 'Impact Reporter',
    creature: 'Egret',
    zone: 'part',
    sources: { part: 1 },         // deep in Partnerships
    nudge: [-0.04, 0.05],
    status: 'Pattern',
    territory: 'Partnerships (shared program outcomes)',
    trigger: 'A program reporting period closes',
    instinct: 'Compile outcomes against shared goals',
    catch: 'An impact summary with cited program data',
    guardrails: 'Partner-confidential terms honored; read-only',
    baseline: 'Reporting turnaround; data completeness',
  },
  {
    id: 'donor',
    trust: ['Human approval', 'Donor PII veiled', 'Cited sources'],
    name: 'Donor Steward',
    creature: 'Swan',
    zone: 'fund',
    sources: { fund: 1 },         // deep in Fundraising
    nudge: [0.04, 0.05],
    status: 'Pattern',
    territory: 'Fundraising & Development (donor records & gift history)',
    trigger: 'A major gift lands or a pledge lapses',
    instinct: 'Draft a tailored stewardship note',
    catch: 'A stewardship brief grounded in donor history, with cited sources',
    guardrails: 'Donor PII veiled; a human approves anything sent',
    baseline: 'Stewardship turnaround; donor retention',
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
