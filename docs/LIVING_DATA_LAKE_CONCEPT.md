# The Living Data Lake — concept & metaphor system

A design language for taking the WPS Data Lake from a *picture of consolidated data* to an
*operating system for grounded AI* — narrated as a living Amazonian lake. Every step of the
AI roadmap has a water/nature form, so the same scene can teach the whole journey.

> Honesty rule carries through every mode: the data-state is **illustrative, pending
> discovery**. Nothing here implies the data is final or the agents are live.

---

## The core metaphor

| Roadmap concept | In the lake |
|---|---|
| OneLake **substrate** | The lake itself — one body of water. |
| The four **functions** | The four basins (Engineering, Field Ops, Partnerships, Fundraising). |
| Raw **incoming data** | Rivers / inflow feeding the lake (the upper-right arm). |
| **Readiness** (schema, cadence, governance) | The water *clarifying*: turbid inflow sorts into clean, tinted, labeled currents; **governed** zones wear a soft mist veil you can't see through without authority. |
| **Retrieval / RAG** | *Drawing from the lake.* A question is a stone dropped in; relevant currents converge and a clear answer **surfaces**, carrying the **source droplets** it gathered. |
| **Agents** | *Creatures of the lake.* Each agent is a heron with a **territory** (which basins it may drink from) and an **instinct** (its one job). It patrols, drinks (retrieves), and acts. |
| **Evaluate vs. baseline** | The heron's **catch** tallied against what the old way caught. |
| **Scale + governance** | A **flyway**: many creatures, governed territories, shared rules they all inherit. |

The visual grammar: **still water = data at rest; moving water = data in use.** Glow =
where data lives. Converging current = retrieval. A creature = an agent acting.

---

## The journey (three modes in the experience)

The piece becomes a guided walk through the roadmap, one mode per step-cluster:

1. **The Lake** *(Step 1 — substrate + readiness)* — the four basins glow at rest; the inflow
   feeds; governed areas wear a faint veil. "This is the consolidated, labeled, governed lake."
2. **Retrieval** *(Step 2 — RAG)* — ask a question; currents converge from the matched
   basin(s); an answer surfaces with **cited source points**. "Before any agent, a model can
   ground answers in real records."
3. **Agents** *(Steps 3–5)* — herons patrol their territories on charters; one **edge-case
   agent** is spotlighted doing one real workflow; a panel shows its charter, its catch, and
   how it's measured. "One narrow agent, proven at the edge, then scaled on a pattern."

---

## Step 1 — Readiness, made visible

The substrate exists; readiness is the water becoming *usable*:

- **Accessible** — there is a visible "draw point" (the spring used in Retrieval mode).
- **Structured / labeled** — inflow motes arrive grey and **sort into their basin color** as
  they settle: a literal picture of conforming to a shared schema.
- **Current** — a slow **refresh pulse** sweeps the lake on a known cadence.
- **Governed** — sensitive categories (security-sensitive camera locations, donor PII,
  partner-confidential) sit under a **mist veil**; without authority you see *that* data is
  there but not *into* it. Governance is enforced at the lake, not just labeled.

**Done when:** all four basins share a schema, refresh on a cadence, and veiled zones are
access-controlled in place.

---

## Step 2 — Retrieval (RAG): drawing from the lake

Retrieval is the first thing that *touches* the data, and where data-quality problems surface.

**The interaction (and what it represents):**
1. A question drops in (the existing "Ask the lake").
2. The lake **finds the relevant water**: currents/light stream inward from the basin(s) whose
   records match — grounding, not guessing.
3. An **answer surfaces** at the draw point, and the specific **sources it drew from light up
   as cited points** (traceability).
4. If the relevant water is veiled (governed), the answer says so and withholds — retrieval
   respects access control.

**Design of the real retrieval layer it depicts:**
- Embed + index the consolidated content per function; expose one clean query interface.
- Every answer returns **grounded passages with source references** (record id, function,
  freshness) — the "source points."
- Confidence + freshness travel with the answer; stale or low-confidence draws are flagged.
- Governance is enforced at query time (veiled records never enter a result).

**Done when:** a query returns accurate, grounded results with traceable sources.

---

## Agents — creatures with charters

An agent is not a platform; it's a **creature with a narrow instinct**, living off the
retrieval layer (it drinks from the same well). How a charter is developed:

**The Charter (six fields):**
1. **Territory** — which basins/sources it may draw from. Governed: it inherits the veils;
   it can never drink what it isn't authorized to.
2. **Trigger** — what wakes it: new inflow, a schedule/cadence, or a human request.
3. **Instinct** — the *one* workflow it performs. Tight scope; no generalizing.
4. **Catch** — what it produces, always **grounded via retrieval with cited sources**.
5. **Guardrails** — confidence thresholds, sensitive-category limits, and a **human-in-the-loop**
   handoff for anything consequential.
6. **Baseline & eval** — the pre-agent measure and the success metric its catch is judged against.

**Lifecycle (maps to the roadmap):** charter → build against retrieval (Step 3) → run on real
data → measure vs. baseline (Step 4) → scale the *pattern*, not the agent; new creatures inherit
shared territory rules and guardrails (Step 5).

---

## The edge-case agent — "Ranger Dispatch"

One high-value, mission-aligned workflow, proven at the edge before anything migrates.

- **Workflow:** triage a camera/sensor anomaly into a prioritized, actionable ranger alert.
- **Charter:**
  - *Territory* — Field Ops & Deployments (camera/sensor + deployment records), read-only;
    may consult Partnerships for jurisdiction. Donor/Fundraising basins are **out of territory**.
  - *Trigger* — a new high-confidence detection lands in the Field Ops inflow.
  - *Instinct* — retrieve recent deployments, site history, and partner jurisdiction for that
    location; draft a prioritized alert (what, where, confidence, who to notify, why now).
  - *Catch* — a one-screen dispatch brief with **cited sources**, queued for a human ranger lead.
  - *Guardrails* — never auto-notifies; confidence floor; exact camera coordinates stay veiled
    to unauthorized recipients (governance honored end-to-end).
  - *Baseline & eval* — time-to-triage and precision vs. the current manual process.
- **Why this one:** narrow, clear value, visible impact link to WPS's anti-poaching mission,
  and it exercises the whole stack (governed retrieval → grounded draft → human handoff).
- **In the lake:** a heron over the Field Ops basin. It watches the inflow, dips to draw
  (a retrieval current fires), and surfaces a dispatch card. Its territory is outlined; the
  veiled coordinate sits under mist.

**Done when:** the agent reliably completes this one workflow on real data, and beats the
manual baseline on time-to-triage and precision.

---

## Why this sequencing holds (don't skip ahead)

Readiness gates retrieval (you can't ground on messy, ungoverned data). Retrieval gates agents
(an agent with no grounded well just guesses). One proven agent gates scale (a pattern you can't
yet measure isn't a pattern). The lake makes data *present*; these steps make it *usable*, then
*acted on*, then *scaled* — and the visual metaphor keeps each step honest and legible.
